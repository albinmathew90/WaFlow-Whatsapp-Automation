import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CrmContact } from '../entities/crm-contact.entity';
import { CrmTag } from '../entities/crm-tag.entity';
import { CreateCrmContactDto, UpdateCrmContactDto } from '../dto/crm.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';

@Injectable()
export class CrmContactsService {
  constructor(
    @InjectRepository(CrmContact, 'data')
    private contactsRepository: Repository<CrmContact>,
    @InjectRepository(CrmTag, 'data')
    private tagsRepository: Repository<CrmTag>,
    private auditService: AuditService,
  ) {}

  async create(userId: string, dto: CreateCrmContactDto): Promise<CrmContact> {
    const { tagIds, ...contactData } = dto;
    
    let tags: CrmTag[] = [];
    if (tagIds && tagIds.length > 0) {
      tags = await this.tagsRepository.find({
        where: { id: In(tagIds), userId }
      });
    }

    const contact = this.contactsRepository.create({
      ...contactData,
      userId,
      tags
    });
    const savedContact = await this.contactsRepository.save(contact);
    
    // Log creation
    const contactName = [savedContact.firstName, savedContact.lastName].filter(Boolean).join(' ');
    this.auditService.logInfo(AuditAction.CRM_CONTACT_CREATED, {
      userId,
      metadata: { contactId: savedContact.id, itemName: contactName },
    });

    return savedContact;
  }

  async update(userId: string, contactId: string, dto: UpdateCrmContactDto): Promise<CrmContact | null> {
    const contact = await this.contactsRepository.findOne({ where: { id: contactId, userId }, relations: ['tags'] });
    if (!contact) return null;

    const { tagIds, ...contactData } = dto;

    if (tagIds) {
      const tags = await this.tagsRepository.find({
        where: { id: In(tagIds), userId }
      });
      contact.tags = tags;
    }

    Object.assign(contact, contactData);
    const savedContact = await this.contactsRepository.save(contact);
    
    const contactName = [savedContact.firstName, savedContact.lastName].filter(Boolean).join(' ');
    this.auditService.logInfo(AuditAction.CRM_CONTACT_UPDATED, {
      userId,
      metadata: { contactId: savedContact.id, itemName: contactName },
    });
    
    return savedContact;
  }

  async findAll(userId: string): Promise<CrmContact[]> {
    return this.contactsRepository.find({ 
      where: { userId },
      relations: ['tags', 'segment'],
      order: { createdAt: 'DESC' }
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const contact = await this.contactsRepository.findOne({ where: { id, userId } });
    if (contact) {
      const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
      await this.contactsRepository.delete({ id, userId });
      this.auditService.logInfo(AuditAction.CRM_CONTACT_DELETED, {
        userId,
        metadata: { contactId: id, itemName: contactName },
      });
    }
  }

  async findByPhone(userId: string, phone: string): Promise<CrmContact | null> {
    return this.contactsRepository.findOne({ where: { userId, phone } });
  }

  async bulkCreate(userId: string, dtos: CreateCrmContactDto[]): Promise<CrmContact[]> {
    const contactsToSave = [];
    for (const dto of dtos) {
      const { tagIds, ...contactData } = dto;
      let tags: CrmTag[] = [];
      if (tagIds && tagIds.length > 0) {
        tags = await this.tagsRepository.find({
          where: { id: In(tagIds), userId }
        });
      }
      const contact = this.contactsRepository.create({
        ...contactData,
        userId,
        tags
      });
      contactsToSave.push(contact);
    }
    return this.contactsRepository.save(contactsToSave);
  }

  async bulkRemove(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.contactsRepository.delete({ id: In(ids), userId });
  }

  async getColumns(userId: string): Promise<{ id: string; name: string }[]> {
    // For a real CRM, you might have a separate ContactColumn table. 
    // Here we'll return hardcoded standard columns + any unique keys found in customFields.
    const standardColumns = [
      { id: 'firstName', name: 'First Name' },
      { id: 'lastName', name: 'Last Name' },
      { id: 'phone', name: 'Phone Number' },
      { id: 'email', name: 'Email Address' },
    ];
    
    // In a mature CRM, this could scan all contacts for customFields or pull from a schema table.
    return standardColumns;
  }
}
