import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type MatchType = 'exact' | 'contains' | 'startsWith';

export interface ChatbotRule {
  keyword: string;
  response: string;
  matchType: MatchType;
}

@Entity('chatbots')
export class Chatbot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // In Waflow, this was "instanceId" which is likely the session ID or account ID.
  // ConvoReach uses sessions, so we'll link this to the Session ID or User ID.
  // We'll use sessionId to keep it isolated per WhatsApp connection.
  @Index()
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ default: false })
  enabled: boolean;

  // Messages
  @Column({ name: 'welcome_message', default: 'Hello! Welcome. How can I help you today? 👋' })
  welcomeMessage: string;

  @Column({ name: 'fallback_message', default: "Sorry, I did not understand that. Please try again or type help." })
  fallbackMessage: string;

  @Column({ name: 'offline_message', default: "We are currently offline. Please leave a message and we will get back to you." })
  offlineMessage: string;

  // Branding & Appearance
  @Column({ name: 'bot_name', default: 'Waflow Bot' })
  botName: string;

  @Column({ name: 'bot_icon', default: 'bot' })
  botIcon: string;

  @Column({ name: 'header_text', default: 'Chat with us' })
  headerText: string;

  @Column({ name: 'sub_header_text', default: 'We typically reply within minutes' })
  subHeaderText: string;

  @Column({ name: 'button_label', default: 'Chat' })
  buttonLabel: string;

  @Column({ name: 'primary_color', default: '#25D366' })
  primaryColor: string;

  @Column({ name: 'secondary_color', default: '#128C7E' })
  secondaryColor: string;

  @Column({ default: true })
  gradient: boolean;

  @Column({ name: 'gradient_angle', type: 'int', default: 135 })
  gradientAngle: number;

  @Column({ default: 'bottom-right' })
  position: string; // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

  @Column({ default: 'glassmorphic' })
  theme: string; // 'classic' | 'glassmorphic'

  // Rules stored as JSON for flexibility
  @Column({ type: 'simple-json' })
  rules: ChatbotRule[] = [];

  // Lead Collection
  @Column({ name: 'collect_leads', default: false })
  collectLeads: boolean;

  @Column({ name: 'lead_fields', type: 'simple-json' })
  leadFields: string[] = ['name', 'email'];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
