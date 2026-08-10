import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OtpApplication } from './otp-application.entity';
import { Session } from '../../session/entities/session.entity';

@Entity('application_whatsapp_sessions')
export class ApplicationWhatsappSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => OtpApplication, a => a.whatsappSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  application: OtpApplication;

  @Column({ type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phoneNumber?: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'inactive';

  @Column({ type: 'varchar', length: 255, nullable: true })
  sessionName?: string;

  @Column({ type: 'datetime', nullable: true })
  connectedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  disconnectedAt?: Date;
}
