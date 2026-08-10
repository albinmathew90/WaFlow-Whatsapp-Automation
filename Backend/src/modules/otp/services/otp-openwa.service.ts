import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationWhatsappSession } from '../entities/application-whatsapp-session.entity';
import { OtpApplication } from '../entities/otp-application.entity';
import { SessionService } from '../../session/session.service';
import { MessageDeliveryLog } from '../entities/message-delivery-log.entity';
import { OtpRequest } from '../entities/otp-request.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class OtpOpenwaService {
  private readonly logger = new Logger(OtpOpenwaService.name);

  constructor(
    @InjectRepository(ApplicationWhatsappSession, 'data')
    private readonly awsRepo: Repository<ApplicationWhatsappSession>,
    @InjectRepository(OtpApplication, 'data')
    private readonly appRepo: Repository<OtpApplication>,
    @InjectRepository(MessageDeliveryLog, 'data')
    private readonly deliveryLogRepo: Repository<MessageDeliveryLog>,
    @InjectRepository(OtpRequest, 'data')
    private readonly reqRepo: Repository<OtpRequest>,
    private readonly sessionService: SessionService,
  ) {}

  private async validateApp(applicationId: string, secretKey: string) {
    if (!applicationId || !secretKey) throw new HttpException('Missing credentials', HttpStatus.UNAUTHORIZED);
    const app = await this.appRepo.findOne({ where: { id: applicationId } });
    if (!app || !app.secretKeyHash) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    const isValid = await bcrypt.compare(secretKey, app.secretKeyHash);
    if (!isValid) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    return app;
  }

  async getSessions(applicationId: string, secretKey: string) {
    await this.validateApp(applicationId, secretKey);
    return this.awsRepo.find({ where: { applicationId } });
  }

  async connectSession(applicationId: string, secretKey: string, sessionName: string) {
    const app = await this.validateApp(applicationId, secretKey);
    
    // Create a new session in Waflow
    const newSession = await this.sessionService.create({
      name: sessionName
    }, app.userId);

    const aws = this.awsRepo.create({
      applicationId,
      sessionId: newSession.id,
      sessionName,
      status: 'active',
      isDefault: true,
      connectedAt: new Date()
    });
    await this.awsRepo.save(aws);

    return {
      success: true,
      sessionId: newSession.id,
      sessionName,
    };
  }

  async disconnectSession(applicationId: string, secretKey: string, sessionId: string) {
    await this.validateApp(applicationId, secretKey);
    const aws = await this.awsRepo.findOne({ where: { applicationId, sessionId } });
    if (!aws) throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    
    try {
      await this.sessionService.delete(sessionId);
    } catch (e) {
      // Ignore error if it's already removed
    }

    aws.status = 'inactive';
    aws.disconnectedAt = new Date();
    await this.awsRepo.save(aws);
    return { success: true };
  }

  async getStatus(applicationId: string, secretKey: string) {
    await this.validateApp(applicationId, secretKey);
    const sessions = await this.awsRepo.find({ where: { applicationId } });
    
    const statuses = await Promise.all(sessions.map(async s => {
      try {
         const state = await this.sessionService.findOne(s.sessionId);
         return { sessionId: s.sessionId, name: s.sessionName, status: state.status };
      } catch (e) {
         return { sessionId: s.sessionId, name: s.sessionName, status: 'unknown' };
      }
    }));

    return { sessions: statuses };
  }

  async handleWebhook(payload: any) {
    // payload will contain event details from OpenWA engine (Message Sent, Delivered, Read, Failed)
    // e.g. { event: 'message.ack', data: { id: { id: 'msg-id' }, ack: 3 } }
    this.logger.debug('Received OpenWA Webhook:', payload);
    
    // Example parsing for Baileys webhook
    if (payload?.event === 'messages.update' || payload?.event === 'message.ack') {
       const updates = payload.data || [];
       for (const update of updates) {
         const msgId = update?.key?.id || update?.id?.id;
         const status = update?.update?.status || update?.ack;
         
         if (!msgId) continue;

         const log = await this.deliveryLogRepo.findOne({ where: { messageId: msgId }, relations: ['request'] });
         if (!log) continue;

         // ack statuses in Baileys: 1=SERVER_ACK, 2=DELIVERY_ACK, 3=READ, 4=PLAYED
         if (status === 2 || status === 'DELIVERY_ACK') {
            log.status = 'Delivered';
            log.deliveredAt = new Date();
            log.request.status = 'delivered';
         } else if (status === 3 || status === 4 || status === 'READ') {
            log.status = 'Read';
            log.readAt = new Date();
            log.request.status = 'read';
         } else if (status === 5 || status === 'ERROR') {
            log.status = 'Failed';
            log.failedAt = new Date();
            log.failureReason = update?.update?.messageStubParameters?.[0] || 'Unknown Delivery Error';
            log.request.status = 'failed';
         }

         await this.deliveryLogRepo.save(log);
         await this.reqRepo.save(log.request);
       }
    }

    return { received: true };
  }
}
