import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OtpRequest } from '../entities/otp-request.entity';
import { ApplicationWhatsappSession } from '../entities/application-whatsapp-session.entity';
import { MessageDeliveryLog } from '../entities/message-delivery-log.entity';
import { SessionService } from '../../session/session.service';
import { QUEUE_NAMES } from '../../queue/queue-names';
import { WhatsappOtpProvider } from '../providers/whatsapp-otp.provider';

@Injectable()
export class OtpDeliveryProcessor {
  private readonly logger = new Logger(OtpDeliveryProcessor.name);

  constructor(
    @InjectRepository(OtpRequest, 'data')
    private readonly reqRepo: Repository<OtpRequest>,
    @InjectRepository(ApplicationWhatsappSession, 'data')
    private readonly awsRepo: Repository<ApplicationWhatsappSession>,
    @InjectRepository(MessageDeliveryLog, 'data')
    private readonly deliveryLogRepo: Repository<MessageDeliveryLog>,
    private readonly sessionService: SessionService,
    private readonly whatsappProvider: WhatsappOtpProvider,
  ) {}

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);

    if (job.name === 'send-otp') {
      const { requestId } = job.data;
      
      const request = await this.reqRepo.findOne({ where: { id: requestId } });
      if (!request) {
         throw new Error(`OtpRequest not found for id ${requestId}`);
      }

      // Find default active session for this application
      const aws = await this.awsRepo.findOne({
         where: { applicationId: request.applicationId, isDefault: true, status: 'active' }
      });

      if (!aws) {
         throw new Error(`No active default WhatsApp session found for application ${request.applicationId}`);
      }

      request.status = 'sending';
      await this.reqRepo.save(request);

      try {
         const messageText = job.data.content || 'Your OTP message is missing content.';

         const result = await this.whatsappProvider.sendOtp(
           request.phone,
           messageText,
           { sessionId: aws.sessionId }
         );

         const messageId = result.messageId;

         const log = this.deliveryLogRepo.create({
            requestId: request.id,
            messageId,
            senderSession: aws.sessionId,
            status: 'Sent',
         });
         await this.deliveryLogRepo.save(log);

         request.status = 'sent';
         request.senderSession = aws.sessionId;
         await this.reqRepo.save(request);

         return { success: true, messageId };
      } catch (error: any) {
         this.logger.error(`Failed to send OTP for request ${requestId}: ${error.message}`);
         request.status = 'failed';
         await this.reqRepo.save(request);
         
         const log = this.deliveryLogRepo.create({
            requestId: request.id,
            senderSession: aws.sessionId,
            status: 'Failed',
            failureReason: error.message,
            failedAt: new Date()
         });
         await this.deliveryLogRepo.save(log);

         throw error;
      }
    }
  }
}
