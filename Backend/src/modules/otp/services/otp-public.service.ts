import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, HttpException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { OtpRequest } from '../entities/otp-request.entity';
import { OtpApplication } from '../entities/otp-application.entity';
import { OtpApiKeyLog } from '../entities/otp-api-key-log.entity';
import { OtpLog } from '../entities/otp-log.entity';
import { Request as ExpressRequest } from 'express';
import { OtpTemplate } from '../entities/otp-template.entity';
import { OtpWebhookService } from './otp-webhook.service';
import { MessageService } from '../../message/message.service';
import { OtpAnalyticsService } from './otp-analytics.service';
import { ConfigService } from '@nestjs/config';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../queue/queue-names';

@Injectable()
export class OtpPublicService {
  private readonly queueEnabled: boolean;

  constructor(
    @InjectRepository(OtpRequest, 'data') private requestRepo: Repository<OtpRequest>,
    @InjectRepository(OtpApplication, 'data') private appRepo: Repository<OtpApplication>,
    @InjectRepository(OtpApiKeyLog, 'data') private apiKeyLogRepo: Repository<OtpApiKeyLog>,
    @InjectRepository(OtpLog, 'data') private logRepo: Repository<OtpLog>,
    @InjectRepository(OtpTemplate, 'data') private templateRepo: Repository<OtpTemplate>,
    private webhookService: OtpWebhookService,
    private messageService: MessageService,
    private analyticsService: OtpAnalyticsService,
    @Optional() @InjectQueue(QUEUE_NAMES.OTP) private otpQueue: Queue,
    private configService: ConfigService,
  ) {
    this.queueEnabled = this.configService.get<string>('QUEUE_ENABLED') === 'true';
  }

  private async validateApp(applicationId: string, secretKey: string) {
    if (!applicationId || !secretKey) throw new UnauthorizedException('Missing API credentials');
    const app = await this.appRepo.findOne({ where: { applicationId, status: 'active' } });
    if (!app) throw new UnauthorizedException('Invalid App ID or inactive application');

    if (!app.secretKeyHash) throw new UnauthorizedException('App has no Secret Key configured');
    const isValid = await bcrypt.compare(secretKey, app.secretKeyHash);
    if (!isValid) throw new UnauthorizedException('Invalid Secret Key');
    return app;
  }

  private async logRequest(appId: string | undefined, req: ExpressRequest, statusCode: number, startTime: number) {
    if (!appId) return;
    const latencyMs = Date.now() - startTime;
    await this.apiKeyLogRepo.save(
      this.apiKeyLogRepo.create({
        applicationId: appId,
        endpoint: req.originalUrl || req.url,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        statusCode,
        latencyMs,
      })
    );
  }

  async sendOtp(applicationId: string, secretKey: string, phone: string, templateId: string | undefined, expiry: number | undefined, metadata: any | undefined, req: ExpressRequest) {
    const startTime = Date.now();
    let app: OtpApplication | undefined;
    try {
      app = await this.validateApp(applicationId, secretKey);
      if (!app.defaultWhatsappSessionId) throw new BadRequestException('Application has no default WhatsApp Sender configured');

      let template;
      if (templateId) {
        template = await this.templateRepo.findOne({ where: { id: templateId, applicationId: app.id } });
        if (!template) throw new NotFoundException('Template not found');
        if (template.status !== 'active') throw new BadRequestException('Template is not active');
      } else {
        template = await this.templateRepo.findOne({ where: { applicationId: app.id, status: 'active' } });
        if (!template) throw new NotFoundException('No active templates found for this application');
      }

      const otpLength = app.otpLength || 4;
      const otp = randomInt(0, Math.pow(10, otpLength)).toString().padStart(otpLength, '0');
      const hashedOtp = await bcrypt.hash(otp, 10);
      
      // Expiry calculation
      const expiryMinutes = expiry || app.expiryMinutes || 10;
      const expiresInSeconds = expiryMinutes * 60;
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

      const request = this.requestRepo.create({
        applicationId: app.id,
        templateId: template.id,
        phone,
        hashedOtp,
        status: 'pending',
        attempts: 0,
        expiresAt,
        metadata,
        senderSession: app.defaultWhatsappSessionId,
      });
      await this.requestRepo.save(request);

      const replaceVariables = (str: string | null) => {
        if (!str) return '';
        return str
          .replace(/{{OTP}}/g, otp)
          .replace(/{{otp}}/g, otp)
          .replace(/{{COMPANY}}/g, app!.company || '')
          .replace(/{{APP_NAME}}/g, app!.name || '')
          .replace(/{{EXPIRY}}/g, `${expiryMinutes} Minutes`);
      };

      const parts = [];
      if (template.header) parts.push(`*${replaceVariables(template.header)}*`);
      if (template.body) parts.push(replaceVariables(template.body));
      if (template.footer) parts.push(`_${replaceVariables(template.footer)}_`);
      
      const text = parts.join('\n\n');

      if (this.queueEnabled && this.otpQueue) {
        // Enqueue job to OTP worker
        await this.otpQueue.add('send-otp', {
          requestId: request.id,
          applicationId: app.id,
          phone,
          content: text,
          senderSessionId: app.defaultWhatsappSessionId,
        });
      } else {
        // Queue is disabled — send directly via MessageService
        try {
          // Format phone for WhatsApp: strip + and add @c.us
          const chatId = phone.replace(/^\+/, '').replace(/\s+/g, '') + '@c.us';
          await this.messageService.sendText(app.defaultWhatsappSessionId, {
            chatId,
            text,
          } as any);
          request.status = 'sent';
          await this.requestRepo.save(request);
        } catch (sendErr: any) {
          request.status = 'failed';
          await this.requestRepo.save(request);
          throw sendErr;
        }
      }

      await this.analyticsService.incrementMetric(app.id, 'totalRequests');
      await this.logRequest(app.id, req, 200, startTime);
      return { 
        success: true, 
        requestId: request.id, 
        expiresIn: expiresInSeconds, 
        status: this.queueEnabled ? 'queued' : 'sent'
      };
    } catch (error) {
      const status = error.getStatus ? error.getStatus() : 500;
      await this.logRequest(app?.id || applicationId, req, status, startTime);
      throw error;
    }
  }

  async verifyOtp(applicationId: string, secretKey: string, phone: string, requestId: string, otp: string, req: ExpressRequest) {
    const startTime = Date.now();
    let app: OtpApplication | undefined;
    try {
      app = await this.validateApp(applicationId, secretKey);

      const request = await this.requestRepo.findOne({ where: { id: requestId, applicationId: app.id, phone } });
      if (!request) {
        throw new BadRequestException({ verified: false, message: 'Invalid OTP' });
      }

      if (request.verified || request.status === 'verified') {
        throw new BadRequestException({ verified: false, message: 'Invalid OTP' });
      }

      if (request.status === 'failed') {
        throw new HttpException({ verified: false, message: 'Maximum attempts exceeded' }, 423);
      }

      if (new Date() > new Date(request.expiresAt)) {
        request.status = 'expired';
        await this.requestRepo.save(request);
        await this.logRepo.save(this.logRepo.create({
          applicationId: app.id,
          requestId,
          action: 'FAILED',
          detail: 'OTP Expired'
        }));
        await this.analyticsService.incrementMetric(app.id, 'expired');
        throw new HttpException({ verified: false, message: 'OTP Expired' }, 410);
      }

      const maxAttempts = app.maxAttempts || 5;
      if (request.attempts >= maxAttempts) {
        request.status = 'failed';
        await this.requestRepo.save(request);
        await this.logRepo.save(this.logRepo.create({
          applicationId: app.id,
          requestId,
          action: 'FAILED',
          detail: 'Maximum attempts exceeded'
        }));
        await this.analyticsService.incrementMetric(app.id, 'failed');
        throw new HttpException({ verified: false, message: 'Maximum attempts exceeded' }, 423);
      }

      const isValid = await bcrypt.compare(otp, request.hashedOtp);
      if (!isValid) {
        request.attempts += 1;
        if (request.attempts >= maxAttempts) {
           request.status = 'failed';
        }
        await this.requestRepo.save(request);
        await this.logRepo.save(this.logRepo.create({
          applicationId: app.id,
          requestId,
          action: 'FAILED',
          detail: 'Invalid OTP provided'
        }));
        
        if (request.status === 'failed') {
          await this.analyticsService.incrementMetric(app.id, 'failed');
          throw new HttpException({ verified: false, message: 'Maximum attempts exceeded' }, 423);
        }
        throw new BadRequestException({ verified: false, message: 'Invalid OTP' });
      }

      // Success
      request.status = 'verified';
      request.verified = true;
      request.verifiedAt = new Date();
      await this.requestRepo.save(request);

      await this.logRepo.save(this.logRepo.create({
        applicationId: app.id,
        requestId,
        action: 'VERIFIED',
        detail: 'OTP successfully verified'
      }));

      // Fire Webhook async without awaiting its completion to not block the response
      this.webhookService.deliverWebhook(app.id, requestId, 'otp.verified', { phone, status: 'verified' }).catch(e => console.error(e));

      await this.analyticsService.incrementMetric(app.id, 'verified');
      await this.logRequest(app.id, req, 200, startTime);
      return { verified: true, status: 'verified', requestId: request.id };
    } catch (error) {
      const status = error.getStatus ? error.getStatus() : 500;
      await this.logRequest(app?.id || applicationId, req, status, startTime);
      throw error;
    }
  }

  async resendOtp(
    applicationId: string,
    secretKey: string,
    phone: string,
    previousRequestId: string,
    req: ExpressRequest,
    templateId?: string,
    expiry?: number,
    metadata?: any
  ) {
    const startTime = Date.now();
    let app: OtpApplication | undefined;
    try {
      app = await this.validateApp(applicationId, secretKey);

      const previousRequest = await this.requestRepo.findOne({ where: { id: previousRequestId, applicationId: app.id, phone } });
      if (!previousRequest) {
        throw new NotFoundException('Previous OTP Request not found');
      }

      if (previousRequest.verified) {
        throw new BadRequestException('Cannot resend a verified OTP');
      }

      const maxResends = app.maxResends || 3;
      if (previousRequest.resendCount >= maxResends) {
        throw new HttpException('Maximum resend limit reached', 403);
      }

      const cooldownSeconds = app.cooldownSeconds || 30;
      const timeSinceCreation = (new Date().getTime() - previousRequest.createdAt.getTime()) / 1000;
      if (timeSinceCreation < cooldownSeconds) {
        throw new HttpException('Too Many Requests', 429);
      }

      // Expire previous OTP
      previousRequest.status = 'expired';
      await this.requestRepo.save(previousRequest);

      // Inherit properties if not provided
      const resolvedTemplateId = templateId || previousRequest.templateId;
      const resolvedExpiry = expiry || app.expiryMinutes;
      const resolvedMetadata = metadata || previousRequest.metadata;

      await this.logRepo.save(this.logRepo.create({
        applicationId: app.id,
        requestId: previousRequestId,
        action: 'RESEND_REQUESTED',
        detail: 'Resend triggered'
      }));

      // Generate new OTP (similar to sendOtp logic)
      const senderSession = app.defaultWhatsappSessionId;
      const otp = randomInt(0, Math.pow(10, app.otpLength)).toString().padStart(app.otpLength, '0');
      const hashedOtp = await bcrypt.hash(otp, 10);

      const expiresInSeconds = resolvedExpiry * 60;
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

      const newRequest = this.requestRepo.create({
        applicationId: app.id,
        templateId: resolvedTemplateId,
        phone,
        hashedOtp,
        status: 'pending',
        expiresAt,
        metadata: resolvedMetadata,
        senderSession,
        resendCount: previousRequest.resendCount + 1
      });

      await this.requestRepo.save(newRequest);

      let templateString = 'Your OTP is {{OTP}}';
      if (resolvedTemplateId) {
        const template = await this.templateRepo.findOne({ where: { id: resolvedTemplateId, applicationId: app.id } });
        if (template && template.status === 'active') {
          templateString = template.body;
        } else if (template) {
          throw new BadRequestException('Template is no longer active');
        }
      }

      const content = templateString
        .replace(/{{OTP}}/g, otp)
        .replace(/{{COMPANY}}/g, app.company || '')
        .replace(/{{APP_NAME}}/g, app.name || '')
        .replace(/{{EXPIRY}}/g, `${resolvedExpiry} Minutes`);

      await this.otpQueue.add('send-otp', {
        requestId: newRequest.id,
        phone,
        content,
        senderSession,
        applicationId: app.id
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true
      });

      await this.logRepo.save(this.logRepo.create({
        applicationId: app.id,
        requestId: newRequest.id,
        action: 'RESEND_SUCCESS',
        detail: 'New OTP request generated'
      }));

      await this.analyticsService.incrementMetric(app.id, 'totalRequests');
      await this.logRequest(app.id, req, 200, startTime);
      return { 
        success: true, 
        requestId: newRequest.id, 
        expiresIn: expiresInSeconds 
      };
    } catch (error) {
      const status = error.getStatus ? error.getStatus() : 500;
      await this.logRequest(app?.id || applicationId, req, status, startTime);
      throw error;
    }
  }

  async getOtpStatus(applicationId: string, secretKey: string, requestId: string, req: ExpressRequest) {
    const startTime = Date.now();
    let app: OtpApplication | undefined;
    try {
      app = await this.validateApp(applicationId, secretKey);

      const request = await this.requestRepo.findOne({ where: { id: requestId, applicationId: app.id } });
      if (!request) {
        throw new NotFoundException('OTP Request not found');
      }

      let expiresIn = 0;
      const expiresDate = new Date(request.expiresAt);
      if (expiresDate > new Date()) {
         expiresIn = Math.floor((expiresDate.getTime() - new Date().getTime()) / 1000);
      }

      await this.logRepo.save(this.logRepo.create({
        applicationId: app.id,
        requestId,
        action: 'STATUS_CHECKED',
        detail: `Status check requested. Current status: ${request.status}`
      }));

      await this.logRequest(app.id, req, 200, startTime);
      return {
        requestId: request.id,
        status: request.status.toUpperCase(),
        phone: request.phone,
        expiresIn,
        attempts: request.attempts,
        verified: request.verified
      };
    } catch (error) {
      const status = error.getStatus ? error.getStatus() : 500;
      await this.logRequest(app?.id || applicationId, req, status, startTime);
      throw error;
    }
  }
}
