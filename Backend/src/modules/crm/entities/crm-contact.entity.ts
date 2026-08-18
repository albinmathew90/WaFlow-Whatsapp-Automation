import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { CrmSegment } from './crm-segment.entity';
import { CrmTag } from './crm-tag.entity';
import { jsonColumnType } from '../../../common/utils/column-types';

@Entity('crm_contacts')
export class CrmContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ type: jsonColumnType(), default: '{}' })
  customFields: Record<string, any>;

  @Column({ type: 'varchar', length: 50, default: 'opted_in' })
  status: string;

  @Column({ type: 'varchar', length: 50, default: 'Database' })
  source: string;

  @Column({ type: 'datetime', nullable: true })
  lastActive?: Date;

  @Column({ type: 'datetime', nullable: true })
  lastRepliedAt?: Date;

  @Column({ type: 'int', default: 0 })
  stuckCount: number;

  @Column({ type: 'uuid', nullable: true })
  segmentId?: string;

  @ManyToOne(() => CrmSegment, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'segmentId' })
  segment?: CrmSegment;

  @ManyToMany(() => CrmTag)
  @JoinTable({
    name: 'crm_contacts_tags',
    joinColumn: { name: 'contactId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' }
  })
  tags: CrmTag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
