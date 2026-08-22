import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmTag } from '../entities/crm-tag.entity';
import { CreateCrmTagDto } from '../dto/crm.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';

@Injectable()
export class CrmTagsService {
  constructor(
    @InjectRepository(CrmTag, 'data')
    private tagsRepository: Repository<CrmTag>,
    private auditService: AuditService,
  ) {}

  async create(userId: string, dto: CreateCrmTagDto): Promise<CrmTag> {
    const tag = this.tagsRepository.create({
      ...dto,
      userId,
    });
    const savedTag = await this.tagsRepository.save(tag);
    
    this.auditService.logInfo(AuditAction.CRM_TAG_CREATED, {
      userId,
      metadata: { tagId: savedTag.id, itemName: savedTag.name },
    });
    
    return savedTag;
  }

  async findAll(userId: string): Promise<CrmTag[]> {
    return this.tagsRepository.find({ where: { userId } });
  }

  async remove(userId: string, id: string): Promise<void> {
    const tag = await this.tagsRepository.findOne({ where: { id, userId } });
    if (tag) {
      await this.tagsRepository.delete({ id, userId });
      this.auditService.logInfo(AuditAction.CRM_TAG_DELETED, {
        userId,
        metadata: { tagId: id, itemName: tag.name },
      });
    }
  }
}
