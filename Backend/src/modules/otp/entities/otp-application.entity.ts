import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../crm/entities/user.entity';
import { OtpTemplate } from './otp-template.entity';
import { OtpRequest } from './otp-request.entity';
import { OtpWebhook } from './otp-webhook.entity';
import { ApplicationWhatsappSession } from './application-whatsapp-session.entity';

@Entity('otp_applications')
export class OtpApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  applicationId: string; // The public ID for the SDKs

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  company: string;

  @Column({ type: 'varchar', length: 255 })
  domain: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  logo?: string;

  @Column({ type: 'varchar', nullable: true })
  defaultWhatsappSessionId?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  apiKeyHash?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  secretKeyHash?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  webhookSecret?: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'suspended';

  @Column({ type: 'varchar', length: 20, default: 'development' })
  environment: 'production' | 'staging' | 'development';

  @Column({ type: 'int', default: 4 })
  otpLength: number;

  @Column({ type: 'int', default: 10 })
  expiryMinutes: number;

  @Column({ type: 'int', default: 3 })
  maxAttempts: number;

  @Column({ type: 'int', default: 60 })
  cooldownSeconds: number;

  @Column({ type: 'int', default: 3 })
  maxResends: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => OtpTemplate, t => t.application)
  templates: OtpTemplate[];

  @OneToMany(() => OtpRequest, r => r.application)
  requests: OtpRequest[];

  @OneToMany(() => OtpWebhook, w => w.application)
  webhooks: OtpWebhook[];

  @OneToMany(() => ApplicationWhatsappSession, s => s.application)
  whatsappSessions: ApplicationWhatsappSession[];
}
