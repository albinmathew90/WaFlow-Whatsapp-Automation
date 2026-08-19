import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('chatbot_knowledge')
@Index(['sessionId', 'status', 'priority'])
export class ChatbotKnowledge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column()
  title: string;

  @Column({ default: 'Other' })
  category: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-json' })
  keywords: string[] = [];

  @Column({ type: 'simple-json' })
  synonyms: string[] = [];

  @Column({ type: 'int', default: 5 })
  priority: number;

  @Column({ default: 'active' })
  status: string; // 'active' | 'inactive'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
