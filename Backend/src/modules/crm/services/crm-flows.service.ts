import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmFlow } from '../entities/crm-flow.entity';

import { IsString, IsOptional, IsBoolean, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
  ) {}

  async create(userId: string, dto: CreateFlowDto): Promise<CrmFlow> {
    const flow = this.flowsRepository.create({ ...dto, userId });
    return this.flowsRepository.save(flow);
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
    return this.flowsRepository.save(flow);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.flowsRepository.delete({ id, userId });
  }

  async setEnabled(userId: string, id: string, enabled: boolean): Promise<CrmFlow | null> {
    const flow = await this.flowsRepository.findOne({ where: { id, userId } });
    if (!flow) return null;
    flow.enabled = enabled;
    return this.flowsRepository.save(flow);
  }
}
