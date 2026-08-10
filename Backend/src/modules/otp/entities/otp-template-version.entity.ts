import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OtpTemplate } from './otp-template.entity';

@Entity('otp_template_versions')
export class OtpTemplateVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  templateId: string;

  @ManyToOne(() => OtpTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' })
  template: OtpTemplate;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'text', nullable: true })
  header: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'text', nullable: true })
  footer: string;

  @CreateDateColumn()
  createdAt: Date;
}
