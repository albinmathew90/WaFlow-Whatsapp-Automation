import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { OtpApplication } from './otp-application.entity';
import { jsonColumnType } from '../../../common/utils/column-types';

@Entity('otp_webhooks')
export class OtpWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => OtpApplication, a => a.webhooks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  application: OtpApplication;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: jsonColumnType(), default: '[]' })
  events: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OtpWebhookDelivery, d => d.webhook)
  deliveries: OtpWebhookDelivery[];
}

@Entity('otp_webhook_deliveries')
export class OtpWebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  webhookId: string;

  @ManyToOne(() => OtpWebhook, w => w.deliveries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'webhookId' })
  webhook: OtpWebhook;

  @Column({ type: 'uuid' })
  applicationId: string;

  @Column({ type: 'uuid', nullable: true })
  requestId?: string;

  @Column({ type: 'varchar', length: 50 })
  eventType: string;

  @Column({ type: 'varchar', length: 500 })
  destinationUrl: string;

  @Column({ type: 'int', nullable: true })
  httpStatus?: number;

  @Column({ type: 'text', nullable: true })
  responseBody?: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'varchar', nullable: true })
  nextRetryTime?: string;

  @Column({ type: 'varchar', nullable: true })
  lastAttempt?: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'delivered' | 'failed' | 'dead';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
