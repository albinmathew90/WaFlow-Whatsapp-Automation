import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OtpApplication } from './otp-application.entity';

export type OtpRequestStatus = 'created' | 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'verified' | 'failed' | 'expired' | 'locked' | 'cancelled' | 'pending';

@Entity('otp_requests')
export class OtpRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => OtpApplication, a => a.requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  application: OtpApplication;

  @Column({ type: 'uuid', nullable: true })
  templateId?: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  hashedOtp: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: OtpRequestStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 0 })
  resendCount: number;

  @Column({ type: 'varchar' })
  expiresAt: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: any;

  @Column({ type: 'varchar', length: 255, nullable: true })
  senderSession?: string;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'datetime', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
