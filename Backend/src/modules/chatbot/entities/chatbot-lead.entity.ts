import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export interface ChatbotLeadData {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export interface ChatbotLeadMessage {
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: Date;
}

@Entity('chatbot_leads')
export class ChatbotLead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The connection/session this widget belongs to
  @Index()
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  // Specific to the web visitor
  @Index()
  @Column({ name: 'visitor_session_id' })
  visitorSessionId: string;

  @Column({ default: '' })
  domain: string;

  @Column({ name: 'page_url', default: '' })
  pageUrl: string;

  @Column({ name: 'captured_data', type: 'simple-json' })
  capturedData: ChatbotLeadData = {};

  @Column({ type: 'simple-json' })
  messages: ChatbotLeadMessage[] = [];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
