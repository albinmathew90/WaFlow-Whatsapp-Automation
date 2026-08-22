import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmTemplate } from '../entities/crm-template.entity';
import { CreateCrmTemplateDto } from '../dto/crm.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';

@Injectable()
export class CrmTemplatesService {
  constructor(
    @InjectRepository(CrmTemplate, 'data')
    private templatesRepository: Repository<CrmTemplate>,
    private auditService: AuditService,
  ) {}

  async create(userId: string, dto: CreateCrmTemplateDto): Promise<CrmTemplate> {
    const template = this.templatesRepository.create({
      ...dto,
      userId,
    });
    const savedTemplate = await this.templatesRepository.save(template);

    // Log creation
    this.auditService.logInfo(AuditAction.CRM_TEMPLATE_CREATED, {
      userId,
      metadata: { templateId: savedTemplate.id, itemName: savedTemplate.name },
    });

    return savedTemplate;
  }

  async findAll(userId: string): Promise<CrmTemplate[]> {
    return this.templatesRepository.find({ where: { userId } });
  }

  async findOne(userId: string, id: string): Promise<CrmTemplate | null> {
    return this.templatesRepository.findOne({ where: { id, userId } });
  }

  async update(userId: string, id: string, dto: CreateCrmTemplateDto): Promise<CrmTemplate | null> {
    const template = await this.templatesRepository.findOne({ where: { id, userId } });
    if (!template) return null;
    Object.assign(template, dto);
    const savedTemplate = await this.templatesRepository.save(template);
    
    this.auditService.logInfo(AuditAction.CRM_TEMPLATE_UPDATED, {
      userId,
      metadata: { templateId: savedTemplate.id, itemName: savedTemplate.name },
    });
    
    return savedTemplate;
  }

  async remove(userId: string, id: string): Promise<void> {
    const template = await this.templatesRepository.findOne({ where: { id, userId } });
    if (template) {
      await this.templatesRepository.delete({ id, userId });
      this.auditService.logInfo(AuditAction.CRM_TEMPLATE_DELETED, {
        userId,
        metadata: { templateId: id, itemName: template.name },
      });
    }
  }

  async bulkCreate(userId: string, dtos: CreateCrmTemplateDto[]): Promise<CrmTemplate[]> {
    const templatesToSave = dtos.map(dto => this.templatesRepository.create({ ...dto, userId }));
    return this.templatesRepository.save(templatesToSave);
  }
}
