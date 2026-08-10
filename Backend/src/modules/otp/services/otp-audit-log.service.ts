import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OtpAuditLog } from '../entities/otp-audit-log.entity';

@Injectable()
export class OtpAuditLogService {
  constructor(
    @InjectRepository(OtpAuditLog, 'data')
    private readonly auditLogRepo: Repository<OtpAuditLog>,
  ) {}

  async logEvent(
    applicationId: string,
    event: string,
    message: string,
    status: string = 'success',
    metadata?: any
  ) {
    const log = this.auditLogRepo.create({
      applicationId,
      event,
      message,
      status,
      metadata,
    });
    
    await this.auditLogRepo.save(log);
  }

  async getLogs(applicationId: string, limit = 100) {
    return this.auditLogRepo.find({
      where: { applicationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
