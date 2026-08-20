import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Broadcast,
  BroadcastRecipient,
  BroadcastActivityLog,
  BroadcastStatus,
} from '../entities/broadcast.entity';
import { CreateBroadcastDto, UpdateBroadcastDto } from '../dto/broadcast.dto';
import { CrmContact } from '../../crm/entities/crm-contact.entity';
import { CrmSegment } from '../../crm/entities/crm-segment.entity';
import { InboxService } from '../../inbox/inbox.service';
import { HookManager, HookContext } from '../../../core/hooks';

@Injectable()
export class BroadcastService implements OnModuleInit {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    @InjectRepository(Broadcast, 'data')
    private broadcastRepo: Repository<Broadcast>,
    @InjectRepository(BroadcastRecipient, 'data')
    private recipientRepo: Repository<BroadcastRecipient>,
    @InjectRepository(BroadcastActivityLog, 'data')
    private activityRepo: Repository<BroadcastActivityLog>,
    @InjectRepository(CrmContact, 'data')
    private contactRepo: Repository<CrmContact>,
    @InjectRepository(CrmSegment, 'data')
    private segmentRepo: Repository<CrmSegment>,
    private inboxService: InboxService,
    private hookManager: HookManager,
  ) {}

  onModuleInit() {
    this.hookManager.register(
      'broadcast-service',
      'message:ack',
      async (ctx: HookContext) => {
        await this.handleMessageAck(ctx.data as Record<string, unknown>, ctx.sessionId);
        return { continue: true };
      },
      200,
    );
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateBroadcastDto): Promise<Broadcast> {
    const broadcast = this.broadcastRepo.create({
      userId,
      name: dto.name,
      status: 'draft' as const,
      messageType: (dto.messageType ?? 'template') as Broadcast['messageType'],
      segmentIds: dto.segmentIds ?? [],
      excludeSegmentIds: dto.excludeSegmentIds ?? [],
      excludeContactIds: dto.excludeContactIds ?? [],
      skipActiveWindow: dto.skipActiveWindow ?? false,
      templateId: dto.templateId,
      templateVariables: dto.templateVariables,
      simpleText: dto.simpleText,
      mediaUrl: dto.mediaUrl,
      scheduleType: (dto.scheduleType ?? 'instant') as 'instant' | 'scheduled',
      scheduledAt: dto.scheduledAt,
      sessionId: dto.sessionId,
      batches: dto.batches ?? [],
      retryEnabled: dto.retryEnabled ?? false,
      retryCount: dto.retryCount ?? 1,
      retryIntervalHours: dto.retryIntervalHours ?? 24,
    });
    const saved = await this.broadcastRepo.save(broadcast);
    await this.logActivity(saved.id, 'Created', userId);
    return saved;
  }

  async findAll(userId: string): Promise<Broadcast[]> {
    return this.broadcastRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Broadcast> {
    const bc = await this.broadcastRepo.findOne({ where: { id, userId } });
    if (!bc) throw new NotFoundException('Broadcast not found');
    return bc;
  }

  async update(userId: string, id: string, dto: UpdateBroadcastDto): Promise<Broadcast> {
    const bc = await this.findOne(userId, id);
    if (bc.status === 'running') throw new BadRequestException('Cannot edit a running broadcast. Pause it first.');
    Object.assign(bc, dto);
    const saved = await this.broadcastRepo.save(bc);
    await this.logActivity(id, 'Edited', userId);
    return saved;
  }

  async remove(userId: string, id: string): Promise<void> {
    const bc = await this.findOne(userId, id);
    await this.broadcastRepo.remove(bc);
  }

  async duplicate(userId: string, id: string): Promise<Broadcast> {
    const bc = await this.findOne(userId, id);
    const copy = this.broadcastRepo.create({
      userId: bc.userId,
      name: `${bc.name} (Copy)`,
      status: 'draft' as const,
      messageType: bc.messageType,
      segmentIds: bc.segmentIds,
      excludeSegmentIds: bc.excludeSegmentIds,
      excludeContactIds: bc.excludeContactIds,
      skipActiveWindow: bc.skipActiveWindow,
      templateId: bc.templateId,
      templateVariables: bc.templateVariables,
      simpleText: bc.simpleText,
      mediaUrl: bc.mediaUrl,
      scheduleType: bc.scheduleType,
      scheduledAt: bc.scheduledAt,
      sessionId: bc.sessionId,
      batches: bc.batches,
      retryEnabled: bc.retryEnabled,
      retryCount: bc.retryCount,
      retryIntervalHours: bc.retryIntervalHours,
    });
    const saved = await this.broadcastRepo.save(copy);
    await this.logActivity(saved.id, 'Duplicated', userId);
    return saved;
  }

  // ── Stats / Dashboard ────────────────────────────────────────────────────

  async getDashboardStats(userId: string) {
    const broadcasts = await this.broadcastRepo.find({ where: { userId } });
    return {
      total: broadcasts.length,
      live: broadcasts.filter((b) => b.status === 'running').length,
      sent: broadcasts.filter((b) => b.status === 'completed').length,
      scheduled: broadcasts.filter((b) => b.status === 'scheduled').length,
    };
  }

  // ── Audience Resolution ──────────────────────────────────────────────────

  async resolveAudience(
    userId: string,
    segmentIds: string[],
    excludeSegmentIds: string[],
    excludeContactIds: string[],
    skipActiveWindow: boolean,
    sessionId?: string,
  ): Promise<CrmContact[]> {
    let contacts: CrmContact[] = [];

    if (segmentIds.length === 0) {
      // All contacts
      contacts = await this.contactRepo.find({ where: { userId } });
    } else {
      contacts = await this.contactRepo.find({
        where: { userId, segmentId: In(segmentIds) },
      });
    }

    // Exclude by segment
    if (excludeSegmentIds.length > 0) {
      contacts = contacts.filter(
        (c) => !c.segmentId || !excludeSegmentIds.includes(c.segmentId),
      );
    }

    // Exclude specific contacts
    if (excludeContactIds.length > 0) {
      contacts = contacts.filter((c) => !excludeContactIds.includes(c.id));
    }

    // Exclude opted out
    contacts = contacts.filter((c) => c.status !== 'opted_out');

    // Skip active conversation window (12 hours)
    if (skipActiveWindow && sessionId) {
      const activeChatIds = await this.inboxService.findActiveChatIds(sessionId, 12);
      contacts = contacts.filter((c) => {
        let cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
        if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
        const chatId = `${cleanPhone}@c.us`;
        return !activeChatIds.includes(chatId);
      });
    }

    return contacts;
  }

  async getAudienceCount(
    userId: string,
    segmentIds: string[],
    excludeSegmentIds: string[],
    excludeContactIds: string[],
    skipActiveWindow: boolean,
    sessionId?: string,
  ): Promise<{ count: number }> {
    const contacts = await this.resolveAudience(
      userId,
      segmentIds,
      excludeSegmentIds,
      excludeContactIds,
      skipActiveWindow,
      sessionId,
    );
    return { count: contacts.length };
  }

  // ── Lifecycle Actions ────────────────────────────────────────────────────

  async launch(userId: string, id: string): Promise<Broadcast> {
    const bc = await this.findOne(userId, id);
    if (!['draft', 'scheduled'].includes(bc.status)) {
      throw new BadRequestException(`Cannot launch a broadcast in '${bc.status}' state.`);
    }

    // Resolve audience
    const contacts = await this.resolveAudience(
      userId,
      bc.segmentIds,
      bc.excludeSegmentIds,
      bc.excludeContactIds,
      bc.skipActiveWindow,
      bc.sessionId,
    );

    if (contacts.length === 0) {
      throw new BadRequestException('No contacts match the audience criteria.');
    }

    // Create recipients
    const recipients = contacts.map((c) =>
      this.recipientRepo.create({
        broadcastId: bc.id,
        contactId: c.id,
        phone: c.phone,
        name: `${c.firstName} ${c.lastName ?? ''}`.trim(),
        status: 'queued',
      }),
    );
    await this.recipientRepo.save(recipients);

    const isFutureScheduled = bc.scheduleType === 'scheduled' && bc.scheduledAt && new Date(bc.scheduledAt).getTime() > Date.now();
    bc.status = isFutureScheduled ? 'scheduled' : 'queued';
    bc.totalCount = contacts.length;
    bc.queuedCount = contacts.length;
    bc.startedAt = isFutureScheduled ? undefined : new Date().toISOString();
    const saved = await this.broadcastRepo.save(bc);
    await this.logActivity(id, isFutureScheduled ? 'Scheduled' : 'Started', userId);

    // NOTE: Actual sending is handled by an in-process async loop
    // (no Redis/BullMQ required). See BroadcastQueueService.
    return saved;
  }

  async pause(userId: string, id: string): Promise<Broadcast> {
    const bc = await this.findOne(userId, id);
    if (bc.status !== 'running') throw new BadRequestException('Broadcast is not running.');
    bc.status = 'paused';
    const saved = await this.broadcastRepo.save(bc);
    await this.logActivity(id, 'Paused', userId);
    return saved;
  }

  async resume(userId: string, id: string): Promise<Broadcast> {
    const bc = await this.findOne(userId, id);
    if (bc.status !== 'paused') throw new BadRequestException('Broadcast is not paused.');
    bc.status = 'running';
    const saved = await this.broadcastRepo.save(bc);
    await this.logActivity(id, 'Resumed', userId);
    return saved;
  }

  async cancel(userId: string, id: string): Promise<Broadcast> {
    const bc = await this.findOne(userId, id);
    if (['completed', 'cancelled'].includes(bc.status))
      throw new BadRequestException('Broadcast is already finished.');
    bc.status = 'cancelled';
    const saved = await this.broadcastRepo.save(bc);
    await this.logActivity(id, 'Cancelled', userId);
    return saved;
  }

  // ── Recipients ───────────────────────────────────────────────────────────

  async getRecipients(
    userId: string,
    broadcastId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: BroadcastRecipient[]; total: number }> {
    const [data, total] = await this.recipientRepo.findAndCount({
      where: { broadcastId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'ASC' },
    });
    return { data, total };
  }

  async updateRecipientStatus(
    broadcastId: string,
    messageId: string,
    status: string,
  ): Promise<void> {
    const recipient = await this.recipientRepo.findOne({
      where: { broadcastId, messageId },
    });
    if (!recipient) return;
    recipient.status = status as any;
    if (status === 'delivered') recipient.deliveredAt = new Date().toISOString();
    if (status === 'read') recipient.readAt = new Date().toISOString();
    await this.recipientRepo.save(recipient);

    // Update broadcast aggregate counts
    await this.refreshStats(broadcastId);
  }

  // ── Report ───────────────────────────────────────────────────────────────

  async getReport(userId: string, broadcastId: string) {
    const bc = await this.findOne(userId, broadcastId);
    const completionPct =
      bc.totalCount > 0
        ? Math.round(((bc.sentCount + bc.failedCount + bc.skippedCount) / bc.totalCount) * 100)
        : 0;

    return {
      broadcast: bc,
      stats: {
        queued: bc.queuedCount,
        sent: bc.sentCount,
        delivered: bc.deliveredCount,
        read: bc.readCount,
        failed: bc.failedCount,
        skipped: bc.skippedCount,
        retries: bc.retryAttempts,
        completionPct,
      },
    };
  }

  // ── Activity ─────────────────────────────────────────────────────────────

  async getActivity(broadcastId: string): Promise<BroadcastActivityLog[]> {
    return this.activityRepo.find({
      where: { broadcastId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  async handleMessageAck(data: Record<string, unknown>, sessionId?: string) {
    if (!sessionId) return;
    const { messageId, status } = data;
    if (!messageId || !status || typeof messageId !== 'string' || typeof status !== 'string') return;
    if (!['delivered', 'read', 'failed'].includes(status)) return; // Only care about these statuses

    const recipient = await this.recipientRepo.findOne({
      where: { messageId },
      relations: ['broadcast']
    });

    if (!recipient) return;
    
    // Only update if it's from the same session
    if (recipient.broadcast.sessionId !== sessionId) return;

    // Don't downgrade status (e.g. read -> delivered is invalid)
    if (recipient.status === 'read') return;
    if (recipient.status === 'delivered' && status !== 'read') return;
    if (recipient.status === 'failed') return;

    recipient.status = status as 'delivered' | 'read' | 'failed';
    if (status === 'delivered') recipient.deliveredAt = new Date().toISOString();
    if (status === 'read') recipient.readAt = new Date().toISOString();
    
    await this.recipientRepo.save(recipient);
    
    // Update broadcast stats
    await this.refreshStats(recipient.broadcastId);
  }

  private async logActivity(broadcastId: string, action: string, userId?: string, detail?: string) {
    const log = this.activityRepo.create({ broadcastId, action, userId, detail });
    await this.activityRepo.save(log);
  }

  private async refreshStats(broadcastId: string): Promise<void> {
    const counts = await this.recipientRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('r.broadcastId = :broadcastId', { broadcastId })
      .groupBy('r.status')
      .getRawMany();

    const map: Record<string, number> = {};
    counts.forEach((row) => (map[row.status] = parseInt(row.count, 10)));

    await this.broadcastRepo.update(broadcastId, {
      queuedCount: map['queued'] ?? 0,
      sentCount: map['sent'] ?? 0,
      deliveredCount: map['delivered'] ?? 0,
      readCount: map['read'] ?? 0,
      failedCount: map['failed'] ?? 0,
      skippedCount: map['skipped'] ?? 0,
    });

    // Auto-complete if all done
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    const pending = (map['queued'] ?? 0) + (map['sending'] ?? 0) + (map['retrying'] ?? 0);
    if (total > 0 && pending === 0) {
      await this.broadcastRepo.update(broadcastId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    }
  }
}
