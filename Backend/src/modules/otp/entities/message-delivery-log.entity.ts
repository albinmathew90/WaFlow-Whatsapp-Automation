import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OtpRequest } from './otp-request.entity';

@Entity('message_delivery_logs')
export class MessageDeliveryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  requestId: string;

  @ManyToOne(() => OtpRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request: OtpRequest;

  @Column({ type: 'varchar', nullable: true })
  messageId?: string;

  @Column({ type: 'varchar', nullable: true })
  senderSession?: string;

  @Column({ type: 'varchar', default: 'pending' }) // Pending, Queued, Sending, Sent, Delivered, Read, Failed
  status: string;

  @Column({ type: 'datetime', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  readAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  failedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  failureReason?: string;

  @CreateDateColumn()
  createdAt: Date;
}
