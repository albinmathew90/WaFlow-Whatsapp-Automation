import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { CrmContact } from '../entities/crm-contact.entity';
import { Session, SessionStatus } from '../../session/entities/session.entity';
import { Message, MessageDirection, MessageStatus } from '../../message/entities/message.entity';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';

export interface DashboardStatsDto {
  totalMessagesSent: number;
  totalMessagesReceived: number;
  totalContacts: number;
  activeSessions: number;
  trafficData: {
    dates: string[];
    sent: number[];
    received: number[];
  };
  connectionStatus: {
    total: number;
    active: number;
    status: 'HEALTHY' | 'DISCONNECTED' | 'NONE';
  };
  recentActivity: any[];
  deliveredPercent: number;
  readPercent: number;
}

@Injectable()
export class CrmDashboardService {
  constructor(
    @InjectRepository(CrmContact, 'data')
    private contactsRepository: Repository<CrmContact>,
    @InjectRepository(Session, 'data')
    private sessionRepository: Repository<Session>,
    @InjectRepository(Message, 'data')
    private messageRepository: Repository<Message>,
    private auditService: AuditService,
  ) {}

  async getDashboardStats(userId: string): Promise<DashboardStatsDto> {
    // 1. Get total contacts for user
    const totalContacts = await this.contactsRepository.count({
      where: { userId },
    });

    // 2. Get user's sessions to filter messages and count active sessions
    const userSessions = await this.sessionRepository.find({
      where: { userId },
      select: ['id', 'status'],
    });

    const sessionIds = userSessions.map((s) => s.id);
    const activeSessions = userSessions.filter((s) => s.status === SessionStatus.READY).length;

    let totalMessagesSent = 0;
    let totalMessagesReceived = 0;
    let deliveredPercent = 0;
    let readPercent = 0;
    const trafficData = { dates: [] as string[], sent: [] as number[], received: [] as number[] };

    // Always generate 7-day traffic skeleton
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const daysMap = new Map<string, { sent: number; received: number }>();
    
    // Initialize the last 7 days with 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      daysMap.set(dayName, { sent: 0, received: 0 });
      trafficData.dates.push(dayName);
    }

    if (sessionIds.length > 0) {
      // 3. Get all-time message counts
      totalMessagesSent = await this.messageRepository.count({
        where: { sessionId: In(sessionIds), direction: MessageDirection.OUTGOING },
      });

      totalMessagesReceived = await this.messageRepository.count({
        where: { sessionId: In(sessionIds), direction: MessageDirection.INCOMING },
      });

      const deliveredCount = await this.messageRepository.count({
        where: { sessionId: In(sessionIds), direction: MessageDirection.OUTGOING, status: In([MessageStatus.DELIVERED, MessageStatus.READ]) },
      });

      const readCount = await this.messageRepository.count({
        where: { sessionId: In(sessionIds), direction: MessageDirection.OUTGOING, status: MessageStatus.READ },
      });

      deliveredPercent = totalMessagesSent > 0 ? Math.round((deliveredCount / totalMessagesSent) * 100) : 0;
      readPercent = totalMessagesSent > 0 ? Math.round((readCount / totalMessagesSent) * 100) : 0;

      const messagesLast7Days = await this.messageRepository.find({
        where: {
          sessionId: In(sessionIds),
          createdAt: Between(sevenDaysAgo, today),
        },
        select: ['createdAt', 'direction'],
      });

      // Populate counts
      for (const msg of messagesLast7Days) {
        const dayName = msg.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
        if (daysMap.has(dayName)) {
          const counts = daysMap.get(dayName)!;
          if (msg.direction === MessageDirection.OUTGOING) counts.sent++;
          if (msg.direction === MessageDirection.INCOMING) counts.received++;
        }
      }
    }

    for (const day of trafficData.dates) {
      const counts = daysMap.get(day)!;
      trafficData.sent.push(counts.sent);
      trafficData.received.push(counts.received);
    }

    // 5. Connection Status
    let connectionState: 'HEALTHY' | 'DISCONNECTED' | 'NONE' = 'NONE';
    if (sessionIds.length > 0) {
      connectionState = activeSessions > 0 ? 'HEALTHY' : 'DISCONNECTED';
    }

    // 6. Recent Activity (Real Audit Logs)
    const excludeActions = [
      AuditAction.API_KEY_CREATED,
      AuditAction.API_KEY_UPDATED,
      AuditAction.API_KEY_USED,
      AuditAction.API_KEY_REVOKED,
      AuditAction.API_KEY_DELETED,
      AuditAction.API_KEY_AUTH_FAILED,
    ];

    const auditResponse = await this.auditService.findAll({
      userId,
      excludeActions,
      limit: 5,
    });

    const recentActivity = auditResponse.data.map(log => {
      // Map AuditAction to a friendly message
      let message: string = log.action;
      if (log.action === AuditAction.CRM_CONTACT_CREATED) message = `Created contact: ${log.metadata?.contactName || 'Unknown'}`;
      else if (log.action === AuditAction.CRM_TEMPLATE_CREATED) message = `Created template: ${log.metadata?.templateName || 'Unknown'}`;
      else if (log.action === AuditAction.CRM_BROADCAST_SENT) message = `Broadcast created: ${log.metadata?.broadcastName || 'Unknown'}`;
      else if (log.action === AuditAction.CRM_FLOW_CREATED) message = `Created flow: ${log.metadata?.flowName || 'Unknown'}`;
      else if (log.action === AuditAction.CRM_CHATBOT_SETTINGS_UPDATED) message = `Updated chatbot settings`;
      else {
        message = message.replace(/^crm_/i, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (log.metadata?.itemName) {
          message += `: ${log.metadata.itemName}`;
        }
      }
      
      return {
        type: log.severity === 'info' ? 'Info' : log.severity === 'warn' ? 'Warning' : 'Error',
        message,
        timestamp: log.createdAt,
      };
    });

    return {
      totalMessagesSent,
      totalMessagesReceived,
      totalContacts,
      activeSessions,
      trafficData,
      connectionStatus: {
        total: userSessions.length,
        active: activeSessions,
        status: connectionState,
      },
      recentActivity,
      deliveredPercent,
      readPercent,
    };
  }
}
