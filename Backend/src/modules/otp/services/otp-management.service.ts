import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { OtpApplication } from '../entities/otp-application.entity';
import { OtpTemplate } from '../entities/otp-template.entity';
import { OtpWebhook } from '../entities/otp-webhook.entity';
import { OtpTemplateVersion } from '../entities/otp-template-version.entity';
import { OtpLog } from '../entities/otp-log.entity';
import { OtpApiKeyLog } from '../entities/otp-api-key-log.entity';
import { OtpAuditLogService } from './otp-audit-log.service';
import { OtpAnalyticsService } from './otp-analytics.service';
import { SessionService } from '../../session/session.service';

@Injectable()
export class OtpManagementService {
  constructor(
    @InjectRepository(OtpApplication, 'data') private appRepo: Repository<OtpApplication>,
    @InjectRepository(OtpTemplate, 'data') private templateRepo: Repository<OtpTemplate>,
    @InjectRepository(OtpTemplateVersion, 'data') private templateVersionRepo: Repository<OtpTemplateVersion>,
    @InjectRepository(OtpWebhook, 'data') private webhookRepo: Repository<OtpWebhook>,
    @InjectRepository(OtpLog, 'data') private logRepo: Repository<OtpLog>,
    @InjectRepository(OtpApiKeyLog, 'data') private apiKeyLogRepo: Repository<OtpApiKeyLog>,
    private readonly auditLogService: OtpAuditLogService,
    private readonly analyticsService: OtpAnalyticsService,
    private readonly sessionService: SessionService,
  ) {}

  private async validateSessionOwnership(sessionId: string, userId: string) {
    try {
      const session = await this.sessionService.findOne(sessionId);
      if (session.userId !== userId) {
        throw new BadRequestException('The selected WhatsApp session is invalid or you do not have permission to use it.');
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('The selected WhatsApp session is invalid or you do not have permission to use it.');
    }
  }

  async createApplication(userId: string, data: any) {
    // Generate initial keys
    const apiKey = randomBytes(32).toString('hex');
    const secretKey = randomBytes(32).toString('hex');
    const webhookSecret = randomBytes(32).toString('hex');

    if (data.defaultWhatsappSessionId) {
      await this.validateSessionOwnership(data.defaultWhatsappSessionId, userId);
    }

    const apiKeyHash = await bcrypt.hash(apiKey, 10);
    const secretKeyHash = await bcrypt.hash(secretKey, 10);

    const app = this.appRepo.create({
      applicationId: randomUUID(), // Public UUID for SDKs
      userId,
      name: data.name,
      company: data.company || '',
      domain: data.domain || '',
      description: data.description || '',
      logo: data.logo || '',
      environment: data.environment || 'development',
      status: 'active',
      apiKeyHash,
      secretKeyHash,
      webhookSecret,
      defaultWhatsappSessionId: data.defaultWhatsappSessionId,
      otpLength: data.otpLength || 4,
      expiryMinutes: data.expiryMinutes || 10,
      maxAttempts: data.maxAttempts || 3,
      cooldownSeconds: data.cooldownSeconds || 60,
      maxResends: data.maxResends || 3,
    });
    
    const saved = await this.appRepo.save(app);

    await this.auditLogService.logEvent(saved.id, 'Application Created', `Application ${data.name} created successfully.`);

    // ONLY return secrets upon creation
    return {
      ...saved,
      apiKey, // Unhashed
      secretKey, // Unhashed
      webhookSecret, // Unhashed
    };
  }

  async getApplications(userId: string) {
    const apps = await this.appRepo.find({ 
      where: { userId }, 
      order: { createdAt: 'DESC' } 
    });
    // Don't expose hashes to the frontend
    return apps.map(app => {
      const { apiKeyHash, secretKeyHash, ...safeApp } = app;
      return safeApp;
    });
  }

  async getApplication(userId: string, id: string) {
    const app = await this.appRepo.findOne({ where: { id, userId } });
    if (!app) throw new NotFoundException('Application not found');
    const { apiKeyHash, secretKeyHash, ...safeApp } = app;
    return safeApp;
  }

  async updateApplication(userId: string, id: string, data: any) {
    const app = await this.appRepo.findOne({ where: { id, userId } });
    if (!app) throw new NotFoundException('Application not found');

    // Prevent updating sensitive fields directly via this method
    delete data.apiKeyHash;
    delete data.secretKeyHash;
    delete data.webhookSecret;
    delete data.applicationId;

    if (data.defaultWhatsappSessionId && data.defaultWhatsappSessionId !== app.defaultWhatsappSessionId) {
      await this.validateSessionOwnership(data.defaultWhatsappSessionId, userId);
    }

    Object.assign(app, data);
    const saved = await this.appRepo.save(app);

    await this.auditLogService.logEvent(saved.id, 'Application Updated', `Application settings updated.`);

    const { apiKeyHash, secretKeyHash, ...safeApp } = saved;
    return safeApp;
  }

  async deleteApplication(userId: string, id: string) {
    const app = await this.appRepo.findOne({ where: { id, userId } });
    if (!app) throw new NotFoundException('Application not found');
    // Soft delete
    await this.appRepo.softRemove(app);
  }

  async rotateApiKey(userId: string, id: string) {
    const app = await this.appRepo.findOne({ where: { id, userId } });
    if (!app) throw new NotFoundException('Application not found');

    const newApiKey = randomBytes(32).toString('hex');
    app.apiKeyHash = await bcrypt.hash(newApiKey, 10);
    await this.appRepo.save(app);

    await this.auditLogService.logEvent(id, 'API Key Rotated', `A new API key was generated.`);

    return { newApiKey };
  }

  async rotateSecretKey(userId: string, id: string) {
    const app = await this.appRepo.findOne({ where: { id, userId } });
    if (!app) throw new NotFoundException('Application not found');

    const newSecretKey = randomBytes(32).toString('hex');
    app.secretKeyHash = await bcrypt.hash(newSecretKey, 10);
    await this.appRepo.save(app);

    await this.auditLogService.logEvent(id, 'Secret Key Rotated', `A new Secret key was generated.`);

    return { newSecretKey };
  }

  async rotateWebhookSecret(userId: string, id: string) {
    const app = await this.appRepo.findOne({ where: { id, userId } });
    if (!app) throw new NotFoundException('Application not found');

    const newWebhookSecret = randomBytes(32).toString('hex');
    app.webhookSecret = newWebhookSecret; // Stored in plain text for webhook HMAC signing
    await this.appRepo.save(app);

    await this.auditLogService.logEvent(id, 'Webhook Secret Rotated', `A new Webhook Secret was generated.`);

    return { newWebhookSecret };
  }

  async getApiKeyLogs(userId: string, id: string, limit = 100) {
    await this.getApplication(userId, id);
    return this.apiKeyLogRepo.find({ 
      where: { applicationId: id }, 
      order: { createdAt: 'DESC' },
      take: limit 
    });
  }

  async getAnalytics(userId: string, id: string) {
    const app = await this.appRepo.findOne({ where: { id, userId } });
    if (!app) throw new NotFoundException('Application not found');

    return this.analyticsService.getAnalytics(id);
  }

  // --- Templates ---

  async createTemplate(userId: string, appId: string, data: any) {
    await this.getApplication(userId, appId);
    
    if (!data.body || !data.body.includes('{{OTP}}')) {
      throw new BadRequestException('Template body must contain {{OTP}}');
    }

    const template = this.templateRepo.create({
      applicationId: appId,
      userId,
      name: data.name,
      language: data.language || 'en',
      header: data.header,
      body: data.body,
      footer: data.footer,
      description: data.description,
      status: data.status || 'active',
      version: 1,
    });
    const saved = await this.templateRepo.save(template);

    await this.templateVersionRepo.save(this.templateVersionRepo.create({
      templateId: saved.id,
      version: 1,
      header: saved.header,
      body: saved.body,
      footer: saved.footer,
    }));

    return saved;
  }

  async getTemplates(userId: string, appId: string) {
    await this.getApplication(userId, appId);
    return this.templateRepo.find({ where: { applicationId: appId, userId }, order: { createdAt: 'DESC' } });
  }

  async getTemplate(userId: string, appId: string, templateId: string) {
    await this.getApplication(userId, appId);
    const template = await this.templateRepo.findOne({ where: { id: templateId, applicationId: appId, userId } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async updateTemplate(userId: string, appId: string, templateId: string, data: any) {
    const template = await this.getTemplate(userId, appId, templateId);

    if (data.body && !data.body.includes('{{OTP}}')) {
      throw new BadRequestException('Template body must contain {{OTP}}');
    }

    template.name = data.name ?? template.name;
    template.language = data.language ?? template.language;
    template.header = data.header !== undefined ? data.header : template.header;
    template.body = data.body ?? template.body;
    template.footer = data.footer !== undefined ? data.footer : template.footer;
    template.description = data.description !== undefined ? data.description : template.description;
    template.status = data.status ?? template.status;
    template.version += 1;

    const saved = await this.templateRepo.save(template);

    await this.templateVersionRepo.save(this.templateVersionRepo.create({
      templateId: saved.id,
      version: saved.version,
      header: saved.header,
      body: saved.body,
      footer: saved.footer,
    }));

    return saved;
  }

  async deleteTemplate(userId: string, appId: string, templateId: string) {
    const template = await this.getTemplate(userId, appId, templateId);
    await this.templateRepo.softRemove(template);
  }

  async duplicateTemplate(userId: string, appId: string, templateId: string) {
    const template = await this.getTemplate(userId, appId, templateId);
    return this.createTemplate(userId, appId, {
      name: `${template.name} - Copy`,
      language: template.language,
      header: template.header,
      body: template.body,
      footer: template.footer,
      description: template.description,
      status: 'draft',
    });
  }

  async getTemplateVersions(userId: string, appId: string, templateId: string) {
    await this.getTemplate(userId, appId, templateId);
    return this.templateVersionRepo.find({ 
      where: { templateId }, 
      order: { version: 'DESC' }
    });
  }

  async restoreTemplateVersion(userId: string, appId: string, templateId: string, versionId: string) {
    const template = await this.getTemplate(userId, appId, templateId);
    const version = await this.templateVersionRepo.findOne({ where: { id: versionId, templateId } });
    
    if (!version) throw new NotFoundException('Template version not found');

    return this.updateTemplate(userId, appId, templateId, {
      header: version.header,
      body: version.body,
      footer: version.footer,
    });
  }

  async createWebhook(userId: string, appId: string, data: any) {
    await this.getApplication(userId, appId);
    const webhook = this.webhookRepo.create({
      applicationId: appId,
      url: data.url,
      events: data.events || [],
      isActive: true,
    });
    const saved = await this.webhookRepo.save(webhook);

    await this.auditLogService.logEvent(appId, 'Webhook Created', `Webhook for URL ${data.url} created.`);
    
    return saved;
  }

  async getWebhooks(userId: string, appId: string) {
    await this.getApplication(userId, appId);
    return this.webhookRepo.find({ where: { applicationId: appId }, order: { createdAt: 'DESC' } });
  }

  async deleteWebhook(userId: string, appId: string, webhookId: string) {
    await this.getApplication(userId, appId);
    await this.webhookRepo.delete({ id: webhookId, applicationId: appId });
  }

  async testWebhook(userId: string, appId: string, webhookId: string) {
    const app = await this.getApplication(userId, appId);
    const webhook = await this.webhookRepo.findOne({ where: { id: webhookId, applicationId: appId } });
    if (!webhook) throw new NotFoundException('Webhook not found');

    const payload = {
      event: "otp.verified",
      applicationId: app.applicationId,
      requestId: randomUUID(),
      data: {
        phone: "+1234567890",
        status: "verified"
      },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { success: response.ok, status: response.status };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }

  async getLogs(userId: string, appId: string, limit = 100) {
    await this.getApplication(userId, appId);
    return this.logRepo.find({ 
      where: { applicationId: appId }, 
      order: { createdAt: 'DESC' },
      take: limit 
    });
  }
}
