import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Message, MessageStatus, MessageDirection } from '../message/entities/message.entity';
import { CrmContact } from '../crm/entities/crm-contact.entity';

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);

  constructor(
    @InjectRepository(Message, 'data')
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(CrmContact, 'data')
    private readonly contactRepository: Repository<CrmContact>,
  ) {}

  // Helper to determine the start and end dates based on filter
  private getTimeRangeBounds(timeRange?: string, customDate?: string): { startDate: Date, endDate: Date, isHourly: boolean, points: number } {
    let endDate = new Date();
    let startDate = new Date();
    let isHourly = false;
    let points = 0;

    if (timeRange === 'custom' && customDate) {
      endDate = new Date(`${customDate}T23:59:59Z`);
      startDate = new Date(`${customDate}T00:00:00Z`);
      isHourly = true;
      points = 24;
    } else if (timeRange === '24h') {
      startDate.setHours(startDate.getHours() - 24);
      isHourly = true;
      points = 24;
    } else if (timeRange === '30d') {
      startDate.setDate(startDate.getDate() - 30);
      isHourly = false;
      points = 30;
    } else {
      // Default to 7 days
      startDate.setDate(startDate.getDate() - 7);
      isHourly = false;
      points = 7;
    }

    return { startDate, endDate, isHourly, points };
  }

  async getSummary(sessionId: string, timeRange?: string, customDate?: string) {
    const { startDate, endDate, isHourly, points } = this.getTimeRangeBounds(timeRange, customDate);

    // Fetch messages within the time bounds
    const outgoingMessages = await this.messageRepository.find({
      where: { sessionId, direction: MessageDirection.OUTGOING, createdAt: LessThan(endDate) },
      select: ['status', 'createdAt', 'metadata', 'chatId']
    });

    const incomingMessages = await this.messageRepository.find({
      where: { sessionId, direction: MessageDirection.INCOMING, createdAt: LessThan(endDate) },
      select: ['createdAt', 'chatId']
    });

    // 1. Overall Delivery Rate & Read Rate for the period
    let totalOutgoing = 0;
    
    let delivered = 0;
    let read = 0;
    let stuck = 0; // Stuck at SENT for > 24 hours relative to NOW, or just stuck within the period
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Initialize chart data buckets
    const chartBuckets = new Map<string, { sent: number, delivered: number, read: number }>();
    
    // Create empty buckets
    for (let i = points; i >= 0; i--) {
      const d = new Date(endDate);
      if (isHourly) {
        d.setHours(d.getHours() - i);
      } else {
        d.setDate(d.getDate() - i);
      }
      
      let key = '';
      if (isHourly) {
        const h = d.getHours();
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        key = `${hour12} ${ampm}, ${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
      } else {
        key = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
      }
      chartBuckets.set(key, { sent: 0, delivered: 0, read: 0 });
    }

    const apiSentChatIds = new Set<string>();

    for (const msg of outgoingMessages) {
      if (msg.metadata?.source !== 'api') continue;
      
      apiSentChatIds.add(msg.chatId);

      if (msg.createdAt >= startDate) {
        totalOutgoing++;
        if (msg.status === MessageStatus.DELIVERED || msg.status === MessageStatus.READ) delivered++;
        if (msg.status === MessageStatus.READ) read++;
      }

      // Stuck logic: count if it was created during the period, is still SENT, and is older than 24h
      if (msg.status === MessageStatus.SENT && msg.createdAt < twentyFourHoursAgo && msg.createdAt >= startDate) {
        stuck++;
      }

      // Add to chart buckets
      if (msg.createdAt >= startDate) {
        let key = '';
        if (isHourly) {
          const h = msg.createdAt.getHours();
          const ampm = h >= 12 ? 'PM' : 'AM';
          const hour12 = h % 12 || 12;
          key = `${hour12} ${ampm}, ${msg.createdAt.toLocaleString('en-US', { month: 'short' })} ${msg.createdAt.getDate()}`;
        } else {
          key = `${msg.createdAt.toLocaleString('en-US', { month: 'short' })} ${msg.createdAt.getDate()}`;
        }

        const bucket = chartBuckets.get(key);
        if (bucket) {
          bucket.sent++;
          if (msg.status === MessageStatus.DELIVERED || msg.status === MessageStatus.READ) bucket.delivered++;
          if (msg.status === MessageStatus.READ) bucket.read++;
        }
      }
    }

    let replied = 0;
    for (const msg of incomingMessages) {
      if (msg.createdAt >= startDate && apiSentChatIds.has(msg.chatId)) {
        replied++;
      }
    }

    const deliveryRate = totalOutgoing > 0 ? (delivered / totalOutgoing) : 0;
    const readRate = totalOutgoing > 0 ? (read / totalOutgoing) : 0;
    const stuckRate = totalOutgoing > 0 ? (stuck / totalOutgoing) : 0;
    const replyRate = totalOutgoing > 0 ? (replied / totalOutgoing) : 0;

    // Account Status logic
    let accountStatus = 'good';
    if (totalOutgoing > 0) {
      if (stuckRate > 0.05 || deliveryRate < 0.8) accountStatus = 'warning';
      if (stuckRate > 0.1 || deliveryRate < 0.6) accountStatus = 'critical';
    }

    // Format chart data
    const chartData = Array.from(chartBuckets.entries()).map(([name, counts]) => ({
      name,
      Sent: counts.sent,
      Delivered: counts.delivered,
      Read: counts.read
    }));

    return {
      deliveryRate,
      readRate,
      stuckRate,
      replyRate,
      accountStatus,
      rawCounts: {
        totalOutgoing,
        delivered,
        read,
        stuck,
      },
      chartData
    };
  }

  async getStuckContacts(sessionId: string, timeRange?: string, customDate?: string) {
    const { startDate, endDate } = this.getTimeRangeBounds(timeRange, customDate);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // If the endDate is more recent than 24 hours ago, we use twentyFourHoursAgo as the upper bound for finding stuck messages.
    // If we're searching historically (e.g. custom date from a month ago), we use the endDate.
    const cutoffDate = endDate < twentyFourHoursAgo ? endDate : twentyFourHoursAgo;
    
    // Find messages stuck at SENT within the bounds
    const stuckMessages = await this.messageRepository.find({
      where: {
        sessionId,
        direction: MessageDirection.OUTGOING,
        status: MessageStatus.SENT,
        // Using query builder for createdAt BETWEEN startDate AND cutoffDate is better but we can filter in memory or use LessThan / And
      },
      order: { createdAt: 'DESC' }
    });

    const filteredStuck = stuckMessages.filter(m => 
      m.metadata?.source === 'api' && 
      m.createdAt >= startDate && 
      m.createdAt <= cutoffDate
    );

    // Extract unique chat IDs
    const chatIds = [...new Set(filteredStuck.map(m => m.chatId))];
    
    const results = [];
    for (const chatId of chatIds) {
      const messagesForChat = filteredStuck.filter(m => m.chatId === chatId);
      const latestMsg = messagesForChat[0]; // first one is latest due to DESC
      
      const stuckSinceHours = Math.floor((Date.now() - latestMsg.createdAt.getTime()) / (1000 * 60 * 60));
      
      // Look up CRM contact
      let contactName = 'Unknown';
      let contactStatus = 'opted_in';
      const crmContact = await this.contactRepository.findOne({
         where: { phone: chatId.replace('@s.whatsapp.net', '') }
      });

      if (crmContact) {
        contactName = `${crmContact.firstName} ${crmContact.lastName || ''}`.trim();
        contactStatus = crmContact.status;
      }

      results.push({
        chatId,
        contactName,
        contactStatus,
        lastMessageId: latestMsg.id,
        messageContent: latestMsg.body, // Fixed to map to frontend 'messageContent' instead of 'body'
        stuckSinceHours,
        optedOut: contactStatus === 'opted_out'
      });
    }

    return results;
  }

  async markOptedOut(sessionId: string, chatIds: string[]) {
    for (const chatId of chatIds) {
      const phone = chatId.replace('@s.whatsapp.net', '').replace('@c.us', '');
      const contact = await this.contactRepository.findOne({ where: { phone } });
      if (contact) {
        contact.status = 'opted_out';
        await this.contactRepository.save(contact);
        this.logger.log(`Marked contact ${phone} as opted out.`);
      } else {
        // Create dummy contact to hold opt-out status
        const newContact = this.contactRepository.create({
          firstName: 'Unknown',
          phone,
          status: 'opted_out',
          userId: '00000000-0000-0000-0000-000000000000' // Requires valid UUID or we can use session's user ID if available
        });
        // await this.contactRepository.save(newContact); // Only save if we resolve userId correctly
      }
    }
    return { success: true, count: chatIds.length };
  }
}
