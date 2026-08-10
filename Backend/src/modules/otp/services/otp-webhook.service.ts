import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { request } from 'undici';
import { OtpWebhook, OtpWebhookDelivery } from '../entities/otp-webhook.entity';

@Injectable()
export class OtpWebhookService {
  private readonly logger = new Logger(OtpWebhookService.name);
  
  // Retry intervals: 30s, 2m, 10m, 30m, 1h
  private readonly RETRY_DELAYS_MS = [
    30 * 1000,
    2 * 60 * 1000,
    10 * 60 * 1000,
    30 * 60 * 1000,
    60 * 60 * 1000
  ];

  constructor(
    @InjectRepository(OtpWebhook, 'data') private webhookRepo: Repository<OtpWebhook>,
    @InjectRepository(OtpWebhookDelivery, 'data') private deliveryRepo: Repository<OtpWebhookDelivery>,
  ) {}

  async deliverWebhook(appId: string, requestId: string, eventType: string, payload: any) {
    const webhooks = await this.webhookRepo.find({ where: { applicationId: appId, isActive: true } });
    
    for (const hook of webhooks) {
      if (hook.events.includes(eventType) || hook.events.includes('*')) {
        const delivery = this.deliveryRepo.create({
          webhookId: hook.id,
          applicationId: appId,
          requestId,
          eventType,
          destinationUrl: hook.url,
          status: 'pending',
          retryCount: 0,
        });
        const savedDelivery = await this.deliveryRepo.save(delivery);
        
        // Start background delivery
        this.attemptDelivery(savedDelivery, payload).catch(e => this.logger.error(`Webhook delivery trigger failed`, e));
      }
    }
  }

  private async attemptDelivery(delivery: OtpWebhookDelivery, payload: any) {
    delivery.lastAttempt = new Date().toISOString();
    
    try {
      const response = await request(delivery.destinationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Waflow-OTP-Webhook/1.0',
          'X-Request-Id': delivery.requestId || '',
          'X-Event-Type': delivery.eventType,
        },
        body: JSON.stringify(payload),
        headersTimeout: 10000,
        bodyTimeout: 10000,
      });

      delivery.httpStatus = response.statusCode;
      const body = await response.body.text();
      delivery.responseBody = body ? body.substring(0, 1000) : undefined;

      if (response.statusCode >= 200 && response.statusCode < 300) {
        delivery.status = 'delivered';
      } else if (response.statusCode >= 500 || response.statusCode === 429) {
        // Temporary failure, retry
        this.scheduleRetry(delivery, payload);
        return; // Don't save yet, scheduleRetry handles saving
      } else {
        // 4xx error (except 429), permanent failure
        delivery.status = 'dead';
      }
    } catch (error) {
      this.logger.error(`Webhook failed for ${delivery.destinationUrl}: ${error.message}`);
      delivery.responseBody = error.message.substring(0, 1000);
      this.scheduleRetry(delivery, payload);
      return;
    }

    await this.deliveryRepo.save(delivery);
  }

  private scheduleRetry(delivery: OtpWebhookDelivery, payload: any) {
    if (delivery.retryCount >= this.RETRY_DELAYS_MS.length) {
      delivery.status = 'dead';
      this.deliveryRepo.save(delivery).catch(e => this.logger.error(e));
      return;
    }

    const delay = this.RETRY_DELAYS_MS[delivery.retryCount];
    delivery.retryCount += 1;
    delivery.status = 'failed';
    delivery.nextRetryTime = new Date(Date.now() + delay).toISOString();
    
    this.deliveryRepo.save(delivery).catch(e => this.logger.error(e));

    // Schedule the retry in-memory
    setTimeout(() => {
      this.attemptDelivery(delivery, payload).catch(e => this.logger.error(e));
    }, delay);
  }
}
