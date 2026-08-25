import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('whatsapp_trial_history')
export class WhatsappTrialHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column({ nullable: true })
  accountId?: string;

  @CreateDateColumn()
  startedAt: Date;
}
