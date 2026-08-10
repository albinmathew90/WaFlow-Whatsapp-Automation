import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '../queue-names';
import { MessageService } from '../../message/message.service';
import { OtpRequest } from '../../otp/entities/otp-request.entity';

export interface OtpJobData {
  requestId: string;
  applicationId: string;
  phone: string;
  text: string;
  senderSessionId: string;
}

@Processor(QUEUE_NAMES.OTP)
@Injectable()
export class OtpProcessor extends WorkerHost {
  private readonly logger = new Logger(OtpProcessor.name);

  constructor(
    @InjectRepository(OtpRequest, 'data') private requestRepo: Repository<OtpRequest>,
    private messageService: MessageService,
  ) {
    super();
  }

  async process(job: Job<OtpJobData>): Promise<void> {
    const { requestId, phone, text, senderSessionId } = job.data;
    this.logger.debug(`Processing OTP Job ${job.id} for Request ${requestId}`);

    const chatId = phone.includes('@c.us') || phone.includes('@s.whatsapp.net') ? phone : `${phone}@c.us`;

    try {
      // Execute actual send via MessageService (which calls OpenWA engine)
      await this.messageService.sendText(senderSessionId, {
        chatId,
        text,
      });
      // Success
      this.logger.debug(`OTP Request ${requestId} successfully sent to ${chatId}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP for Request ${requestId}: ${error.message}`);
      
      // If it's a permanent failure or retries exhausted, we should mark as failed
      // BullMQ will handle retries automatically if this throws. But if we want to catch and fail immediately:
      await this.requestRepo.update(requestId, { status: 'failed' });
      
      throw error; // Rethrow so BullMQ logs it as failed
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<OtpJobData>, error: Error) {
    this.logger.error(`OTP Job ${job.id} completely failed after retries: ${error.message}`);
  }
}
