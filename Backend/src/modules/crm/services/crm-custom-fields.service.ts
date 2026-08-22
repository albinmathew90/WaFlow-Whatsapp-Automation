import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmCustomField } from '../entities/crm-custom-field.entity';
import { CreateCrmCustomFieldDto, UpdateCrmCustomFieldDto } from '../dto/crm.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';

@Injectable()
export class CrmCustomFieldsService {
  constructor(
    @InjectRepository(CrmCustomField, 'data')
    private customFieldsRepository: Repository<CrmCustomField>,
    private auditService: AuditService,
  ) {}

  async create(userId: string, dto: CreateCrmCustomFieldDto): Promise<CrmCustomField> {
    const field = this.customFieldsRepository.create({
      ...dto,
      userId,
    });
    const savedField = await this.customFieldsRepository.save(field);
    
    this.auditService.logInfo(AuditAction.CRM_CUSTOM_FIELD_CREATED, {
      userId,
      metadata: { fieldId: savedField.id, itemName: savedField.name },
    });
    
    return savedField;
  }

  async findAll(userId: string): Promise<CrmCustomField[]> {
    return this.customFieldsRepository.find({ where: { userId } });
  }

  async update(userId: string, id: string, dto: UpdateCrmCustomFieldDto): Promise<CrmCustomField> {
    const field = await this.customFieldsRepository.findOne({ where: { id, userId } });
    if (!field) throw new NotFoundException('Custom field not found');
    Object.assign(field, dto);
    const savedField = await this.customFieldsRepository.save(field);
    
    this.auditService.logInfo(AuditAction.CRM_CUSTOM_FIELD_UPDATED, {
      userId,
      metadata: { fieldId: savedField.id, itemName: savedField.name },
    });
    
    return savedField;
  }

  async remove(userId: string, id: string): Promise<void> {
    const field = await this.customFieldsRepository.findOne({ where: { id, userId } });
    if (field) {
      await this.customFieldsRepository.delete({ id, userId });
      this.auditService.logInfo(AuditAction.CRM_CUSTOM_FIELD_DELETED, {
        userId,
        metadata: { fieldId: id, itemName: field.name },
      });
    }
  }
}
