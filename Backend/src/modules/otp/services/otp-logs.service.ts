import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OtpRequest } from '../entities/otp-request.entity';
import { OtpWebhookDelivery } from '../entities/otp-webhook.entity';
import { OtpAuditLog } from '../entities/otp-audit-log.entity';

@Injectable()
export class OtpLogsService {
  constructor(
    @InjectRepository(OtpRequest, 'data')
    private readonly requestRepo: Repository<OtpRequest>,
    @InjectRepository(OtpWebhookDelivery, 'data')
    private readonly webhookDeliveryRepo: Repository<OtpWebhookDelivery>,
    @InjectRepository(OtpAuditLog, 'data')
    private readonly auditLogRepo: Repository<OtpAuditLog>,
  ) {}

  async getOtpLogs(applicationId: string, limit: number = 50, offset: number = 0) {
    const [data, total] = await this.requestRepo.findAndCount({
      where: { applicationId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { data, total };
  }

  async getWebhookLogs(applicationId: string, limit: number = 50, offset: number = 0) {
    const [data, total] = await this.webhookDeliveryRepo.findAndCount({
      where: { applicationId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['webhook']
    });
    return { data, total };
  }

  async getAuditLogs(applicationId: string, limit: number = 50, offset: number = 0) {
    const [data, total] = await this.auditLogRepo.findAndCount({
      where: { applicationId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { data, total };
  }
}
