import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chatbot } from '../entities/chatbot.entity';
import { ChatbotLead } from '../entities/chatbot-lead.entity';
import { ChatbotKnowledge } from '../entities/chatbot-knowledge.entity';
import { KnowledgeEngineService } from './knowledge-engine.service';
import { CrmEventsGateway } from '../../crm/gateways/crm-events.gateway';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectRepository(Chatbot, 'data')
    private readonly chatbotRepo: Repository<Chatbot>,
    @InjectRepository(ChatbotLead, 'data')
    private readonly chatbotLeadRepo: Repository<ChatbotLead>,
    @InjectRepository(ChatbotKnowledge, 'data')
    private readonly chatbotKnowledgeRepo: Repository<ChatbotKnowledge>,
    private readonly knowledgeEngineService: KnowledgeEngineService,
    private readonly eventsGateway: CrmEventsGateway,
  ) {}

  // ─── Chatbot Settings ──────────────────────────────────────────────────────────
  async getSettings(sessionId: string): Promise<Chatbot> {
    let chatbot = await this.chatbotRepo.findOne({ where: { sessionId } });
    if (!chatbot) {
      chatbot = this.chatbotRepo.create({ sessionId });
      await this.chatbotRepo.save(chatbot);
    }
    return chatbot;
  }

  async updateSettings(sessionId: string, data: Partial<Chatbot>): Promise<Chatbot> {
    const chatbot = await this.getSettings(sessionId);
    Object.assign(chatbot, data);
    return await this.chatbotRepo.save(chatbot);
  }

  // ─── Chatbot Widget API (Public) ────────────────────────────────────────────────
  async handleWidgetMessage(chatbotId: string, payload: any): Promise<any> {
    const chatbot = await this.chatbotRepo.findOne({ where: { id: chatbotId } });
    if (!chatbot) throw new NotFoundException('Chatbot not found');
    if (!chatbot.enabled) {
      return { reply: chatbot.offlineMessage || "We're currently offline.", suggestions: [] };
    }

    // The widget-script uses 'sessionId' to pass the visitor's local tracking ID
    const visitorSessionId = payload.sessionId;
    const domain = payload.domain || payload.origin || '';
    const { message, pageUrl, capturedData } = payload;
    
    // Find or Create Lead (we must link to the chatbot's true owner session, i.e., chatbot.sessionId)
    let lead = await this.chatbotLeadRepo.findOne({ where: { visitorSessionId, sessionId: chatbot.sessionId } });
    if (!lead) {
      lead = this.chatbotLeadRepo.create({
        sessionId: chatbot.sessionId,
        visitorSessionId,
        domain,
        pageUrl,
        capturedData: capturedData || {},
        messages: [],
      });
    } else if (capturedData) {
      // Update captured data if provided later
      lead.capturedData = { ...lead.capturedData, ...capturedData };
    }

    if (message) {
      // Add user message to history
      const userMsg = { sender: 'user' as const, text: message, timestamp: new Date() };
      lead.messages = [...(lead.messages || []), userMsg];
      
      // Determine bot reply
      let botReply = '';
      let suggestions: string[] = [];

      // 1. Check exact/contains rules
      const ruleMatch = (chatbot.rules || []).find((rule: any) => {
        const text = message.toLowerCase();
        // Support comma-separated keywords: "hi, hello, hey"
        const keywords = rule.keyword.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
        return keywords.some((kw: string) => {
          if (rule.matchType === 'exact') return text === kw;
          if (rule.matchType === 'contains') return text.includes(kw);
          if (rule.matchType === 'startsWith') return text.startsWith(kw);
          return false;
        });
      });

      if (ruleMatch) {
        botReply = ruleMatch.response;
      } else {
        // 2. Use Knowledge Engine NLP
        const knowledgeItems = await this.chatbotKnowledgeRepo.find({ where: { sessionId: chatbot.sessionId } });
        const result = await this.knowledgeEngineService.query(message, knowledgeItems, visitorSessionId, chatbot.fallbackMessage);
        botReply = result.reply;
        suggestions = result.suggestions;
      }

      const botMsg = { sender: 'bot' as const, text: botReply, timestamp: new Date() };
      lead.messages.push(botMsg);
      await this.chatbotLeadRepo.save(lead);

      // Emit WebSocket event to Dashboard via CrmEventsGateway
      this.eventsGateway.server.to(`user:${chatbot.sessionId}`).emit('chatbot:lead:message', {
        leadId: lead.id,
        sessionId: chatbot.sessionId,
        visitorSessionId,
        domain,
        capturedData: lead.capturedData,
        message: userMsg,
        reply: botMsg,
      });

      return { reply: botReply, suggestions };
    }

    // Just creating/updating session (no message)
    await this.chatbotLeadRepo.save(lead);
    
    this.eventsGateway.server.to(`user:${chatbot.sessionId}`).emit('chatbot:lead:message', {
      leadId: lead.id,
      sessionId: chatbot.sessionId,
      visitorSessionId,
      domain,
      capturedData: lead.capturedData,
      message: null,
      reply: null,
    });
    
    return { success: true };
  }

  // ─── Chatbot Leads (Dashboard) ──────────────────────────────────────────────────
  async getLeads(sessionId: string): Promise<ChatbotLead[]> {
    return await this.chatbotLeadRepo.find({ 
      where: { sessionId },
      order: { updatedAt: 'DESC' }
    });
  }

  async replyToLead(sessionId: string, leadId: string, text: string): Promise<ChatbotLead> {
    const lead = await this.chatbotLeadRepo.findOne({ where: { id: leadId, sessionId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const agentMsg = { sender: 'agent' as const, text, timestamp: new Date() };
    lead.messages = [...(lead.messages || []), agentMsg];
    await this.chatbotLeadRepo.save(lead);

    // If there is a socket connected for this visitor, emit it to them directly
    this.eventsGateway.server.to(`visitor_${lead.visitorSessionId}`).emit('chatbot:agent_reply', {
      message: agentMsg
    });

    return lead;
  }

  async deleteLead(sessionId: string, leadId: string): Promise<{ success: boolean }> {
    const lead = await this.chatbotLeadRepo.findOne({ where: { id: leadId, sessionId } });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.chatbotLeadRepo.remove(lead);
    return { success: true };
  }

  // ─── Knowledge Base ─────────────────────────────────────────────────────────────
  async getKnowledge(sessionId: string): Promise<ChatbotKnowledge[]> {
    return await this.chatbotKnowledgeRepo.find({ where: { sessionId }, order: { priority: 'DESC' } });
  }

  async createKnowledge(sessionId: string, data: Partial<ChatbotKnowledge>): Promise<ChatbotKnowledge> {
    const item = this.chatbotKnowledgeRepo.create({ ...data, sessionId });
    return await this.chatbotKnowledgeRepo.save(item);
  }

  async updateKnowledge(sessionId: string, id: string, data: Partial<ChatbotKnowledge>): Promise<ChatbotKnowledge> {
    const item = await this.chatbotKnowledgeRepo.findOne({ where: { id, sessionId } });
    if (!item) throw new NotFoundException('Knowledge item not found');
    Object.assign(item, data);
    return await this.chatbotKnowledgeRepo.save(item);
  }

  async deleteKnowledge(sessionId: string, id: string): Promise<void> {
    await this.chatbotKnowledgeRepo.delete({ id, sessionId });
  }
}
