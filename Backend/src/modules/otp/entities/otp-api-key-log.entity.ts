import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OtpApplication } from './otp-application.entity';

@Entity('otp_api_key_logs')
export class OtpApiKeyLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => OtpApplication, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  application: OtpApplication;

  @Column({ type: 'varchar', length: 255 })
  endpoint: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string;

  @Column({ type: 'int' })
  statusCode: number;

  @Column({ type: 'int', nullable: true })
  latencyMs: number;

  @CreateDateColumn()
  createdAt: Date;
}
