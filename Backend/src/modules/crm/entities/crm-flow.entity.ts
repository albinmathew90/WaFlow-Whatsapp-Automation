import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { jsonColumnType } from '../../../common/utils/column-types';

@Entity('crm_flows')
export class CrmFlow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ type: 'varchar', nullable: true, unique: true })
  webhookToken: string;

  @Column({ type: jsonColumnType() })
  trigger: {
    event: string;
    keywords?: string[];
    caseSensitive?: boolean;
    regex?: string;
    skipTrigger?: boolean;
    selectedTemplate?: any;
    triggerEventNames?: string[];
    detectedFields?: Record<string, string[]>;
  };

  @Column({ type: jsonColumnType() })
  nodes: Record<string, any>;

  @Column({ type: jsonColumnType() })
  edges: Array<{ from: string; to: string; branch?: string }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
