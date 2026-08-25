import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('payment_history')
export class PaymentHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  userId: string;

  @Column('int')
  amount: number; // in paise

  @Column({ type: 'varchar', length: 50 })
  planType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpayOrderId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpayPaymentId: string;

  @Column({ type: 'varchar', length: 50, default: 'success' })
  status: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
