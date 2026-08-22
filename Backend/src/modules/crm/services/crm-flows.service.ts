import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmFlow } from '../entities/crm-flow.entity';
import { User } from '../entities/user.entity';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';

import { IsString, IsOptional, IsBoolean, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import * as crypto from 'crypto';

export class EdgeDto {
  @IsString()
  from: string;

  @IsString()
  to: string;

  @IsOptional()
  @IsString()
  branch?: string;
}

export class CreateFlowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsObject()
  trigger: { event: 'keyword' | 'any'; keywords?: string[]; caseSensitive?: boolean };

  @IsObject()
  nodes: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EdgeDto)
  edges: EdgeDto[];
}

@Injectable()
export class CrmFlowsService {
  constructor(
    @InjectRepository(CrmFlow, 'data')
    private flowsRepository: Repository<CrmFlow>,
    @InjectRepository(User, 'data')
    private userRepository: Repository<User>,
    private auditService: AuditService,
  ) {}

  async create(userId: string, dto: CreateFlowDto): Promise<CrmFlow> {
    const flow = this.flowsRepository.create({ ...dto, userId });
    const saved = await this.flowsRepository.save(flow);
    
    await this.auditService.logInfo(AuditAction.CRM_FLOW_CREATED, {
      userId,
      metadata: { flowId: saved.id, itemName: saved.name },
    });
    
    return saved;
  }

  async findAll(userId: string): Promise<CrmFlow[]> {
    return this.flowsRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findAllEnabled(userId?: string): Promise<CrmFlow[]> {
    if (userId) {
      return this.flowsRepository.find({ where: { enabled: true, userId }, order: { createdAt: 'ASC' } });
    }
    return this.flowsRepository.find({ where: { enabled: true }, order: { createdAt: 'ASC' } });
  }

  async deleteAll(userId: string): Promise<void> {
    await this.flowsRepository.delete({ userId });
  }

  async findOne(userId: string, id: string): Promise<CrmFlow | null> {
    return this.flowsRepository.findOne({ where: { id, userId } });
  }

  async update(userId: string, id: string, dto: Partial<CreateFlowDto>): Promise<CrmFlow | null> {
    const flow = await this.flowsRepository.findOne({ where: { id, userId } });
    if (!flow) return null;
    Object.assign(flow, dto);
    const savedFlow = await this.flowsRepository.save(flow);
    
    this.auditService.logInfo(AuditAction.CRM_FLOW_UPDATED, {
      userId,
      metadata: { flowId: savedFlow.id, itemName: savedFlow.name },
    });
    
    return savedFlow;
  }

  async remove(userId: string, id: string): Promise<void> {
    const flow = await this.flowsRepository.findOne({ where: { id, userId } });
    if (flow) {
      await this.flowsRepository.delete({ id, userId });
      this.auditService.logInfo(AuditAction.CRM_FLOW_DELETED, {
        userId,
        metadata: { flowId: id, itemName: flow.name },
      });
    }
  }

  async setEnabled(userId: string, id: string, enabled: boolean): Promise<CrmFlow | null> {
    const flow = await this.flowsRepository.findOne({ where: { id, userId } });
    if (!flow) return null;
    flow.enabled = enabled;
    const savedFlow = await this.flowsRepository.save(flow);
    
    this.auditService.logInfo(AuditAction.CRM_FLOW_UPDATED, {
      userId,
      metadata: { flowId: savedFlow.id, itemName: savedFlow.name, action: enabled ? 'enabled' : 'disabled' },
    });
    
    return savedFlow;
  }

  async getTrigger(userId: string, id: string) {
    const flow = await this.flowsRepository.findOne({ where: { id, userId } });
    if (!flow) return null;
    
    let user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && flow.trigger?.event === 'webhook' && !user.webhookToken) {
      user.webhookToken = crypto.randomBytes(24).toString('hex');
      await this.userRepository.save(user);
    }
    
    return {
      triggerType: flow.trigger?.event,
      triggerEventNames: flow.trigger?.triggerEventNames || [],
      webhookToken: user?.webhookToken || null,
      accountId: userId,
      detectedFields: flow.trigger?.detectedFields || {}
    };
  }

  async updateTrigger(userId: string, id: string, triggerType: string, triggerEventNames: string[]) {
    const flow = await this.flowsRepository.findOne({ where: { id, userId } });
    if (!flow) return null;
    
    if (!flow.trigger) {
      flow.trigger = { event: triggerType, triggerEventNames };
    } else {
      flow.trigger.event = triggerType;
      flow.trigger.triggerEventNames = triggerEventNames;
    }
    
    await this.flowsRepository.save(flow);
    
    let userToken = null;
    if (triggerType === 'webhook') {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        if (!user.webhookToken) {
          user.webhookToken = crypto.randomBytes(24).toString('hex');
          await this.userRepository.save(user);
        }
        userToken = user.webhookToken;
      }
    }
    
    return {
      ...flow,
      webhookToken: userToken,
      accountId: userId
    };
  }

  async regenerateWebhookToken(userId: string, id: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;
    
    user.webhookToken = crypto.randomBytes(24).toString('hex');
    await this.userRepository.save(user);
    
    // Return the flow for response consistency if needed, though we just need success
    const flow = await this.flowsRepository.findOne({ where: { id, userId } });
    return flow;
  }

  async validateWebhookToken(accountId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: accountId } });
    return !!user && user.webhookToken === token;
  }

  async testWebhook(userId: string, id: string, event: string, payload: any) {
    const flow = await this.flowsRepository.findOne({ where: { id, userId } });
    if (!flow) return null;

    const extractFields = (obj: any, prefix = ''): string[] => {
      let fields: string[] = [];
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          fields = fields.concat(extractFields(obj[key], `${prefix}${key}.`));
        } else {
          fields.push(`${prefix}${key}`);
        }
      }
      return fields;
    };

    const detected = extractFields(payload);
    
    if (!flow.trigger) {
      flow.trigger = { event: 'webhook', detectedFields: {} };
    }
    if (!flow.trigger.detectedFields) {
      flow.trigger.detectedFields = {};
    }
    
    flow.trigger.detectedFields[event] = detected;
    await this.flowsRepository.save(flow);
    
    return flow.trigger.detectedFields;
  }
}
