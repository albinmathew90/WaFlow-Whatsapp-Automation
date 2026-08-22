import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmSegment } from '../entities/crm-segment.entity';
import { CreateCrmSegmentDto } from '../dto/crm.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';

@Injectable()
export class CrmSegmentsService {
  constructor(
    @InjectRepository(CrmSegment, 'data')
    private segmentsRepository: Repository<CrmSegment>,
    private auditService: AuditService,
  ) {}

  async create(userId: string, dto: CreateCrmSegmentDto): Promise<CrmSegment> {
    const segment = this.segmentsRepository.create({
      ...dto,
      userId,
    });
    const savedSegment = await this.segmentsRepository.save(segment);
    
    this.auditService.logInfo(AuditAction.CRM_SEGMENT_CREATED, {
      userId,
      metadata: { segmentId: savedSegment.id, itemName: savedSegment.name },
    });
    
    return savedSegment;
  }

  async findAll(userId: string): Promise<CrmSegment[]> {
    return this.segmentsRepository.find({ where: { userId } });
  }

  async remove(userId: string, id: string): Promise<void> {
    const segment = await this.segmentsRepository.findOne({ where: { id, userId } });
    if (segment) {
      await this.segmentsRepository.delete({ id, userId });
      this.auditService.logInfo(AuditAction.CRM_SEGMENT_DELETED, {
        userId,
        metadata: { segmentId: id, itemName: segment.name },
      });
    }
  }
}
