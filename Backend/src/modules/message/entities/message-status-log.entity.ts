import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { MessageStatus } from './message.entity';

@Entity('message_status_log')
@Index(['sessionId', 'createdAt'])
@Index(['waMessageId'])
@Index(['status', 'createdAt'])
export class MessageStatusLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column({ nullable: true })
  waMessageId: string;

  @Column({ nullable: true })
  chatId: string;

  @Column({ type: 'varchar' })
  status: MessageStatus;

  @CreateDateColumn()
  createdAt: Date;
}
