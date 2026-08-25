import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Session } from '../../session/entities/session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  resetPasswordToken?: string;

  @Column({ nullable: true })
  resetPasswordExpires?: Date;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  subscriptionStatus?: string;

  @Column({ default: false })
  hasUsedTrial: boolean;

  @Column({ nullable: true })
  trialExpiresAt?: Date;

  @Column({ nullable: true })
  trialPhoneNumber?: string;

  @Column({ nullable: true })
  renewalDate?: Date;

  @Column({ nullable: true })
  lastRenewedOn?: Date;

  @Column({ nullable: true })
  webhookToken?: string;

  @Column({ nullable: true })
  subscriptionExpiresAt?: Date;

  @Column({ nullable: true })
  planType?: string;

  @Column({ nullable: true })
  razorpayOrderId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
