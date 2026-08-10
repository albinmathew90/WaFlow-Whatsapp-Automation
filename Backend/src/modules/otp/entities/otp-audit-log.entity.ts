import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OtpApplication } from './otp-application.entity';

@Entity('otp_audit_logs')
export class OtpAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => OtpApplication, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  application: OtpApplication;

  @Column({ type: 'varchar', length: 100 })
  event: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50, default: 'success' })
  status: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
