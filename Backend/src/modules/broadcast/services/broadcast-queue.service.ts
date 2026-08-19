import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Broadcast, BroadcastRecipient } from '../entities/broadcast.entity';
import { MessageService } from '../../message/message.service';
import { InboxService } from '../../inbox/inbox.service';
import { TemplateService } from '../../template/template.service';

@Injectable()
export class BroadcastQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BroadcastQueueService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly activeBroadcastIds = new Set<string>();
  private readonly batchState = new Map<string, { messagesInCurrentBatch: number; currentBatchTarget: number }>();

  constructor(
    @InjectRepository(Broadcast, 'data')
    private broadcastRepo: Repository<Broadcast>,
    @InjectRepository(BroadcastRecipient, 'data')
    private recipientRepo: Repository<BroadcastRecipient>,
    private messageService: MessageService,
    private inboxService: InboxService,
    private templateService: TemplateService,
  ) { }

  onModuleInit() {
    // Run the loop every 5 seconds to pick up scheduled or running broadcasts
    this.timer = setInterval(() => this.processQueue(), 5000);
    this.logger.log('BroadcastQueueService initialized (in-memory queue).');
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private personalizeMessage(template: string, contact: BroadcastRecipient): string {
    if (!template) return template;
    const name = contact.name || 'there';
    return template.replace(/{{name}}/g, name);
  }

  private personalizeObject(obj: any, contact: BroadcastRecipient): any {
    if (!obj) return obj;
    try {
      const stringified = JSON.stringify(obj);
      const personalized = this.personalizeMessage(stringified, contact);
      return JSON.parse(personalized);
    } catch {
      return obj;
    }
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async processQueue() {
    try {
      // 1. Launch scheduled broadcasts that are due
      const now = new Date().toISOString();
      const scheduled = await this.broadcastRepo.find({
        where: { status: 'scheduled', scheduledAt: LessThanOrEqual(now) },
      });

      for (const bc of scheduled) {
        bc.status = 'queued';
        await this.broadcastRepo.save(bc);
        this.logger.log(`Scheduled broadcast ${bc.id} moved to queued.`);
      }

      // 2. Process 'queued' and 'running' broadcasts
      const activeBroadcasts = await this.broadcastRepo.find({
        where: [
          { status: 'queued' },
          { status: 'running' },
        ],
        order: { createdAt: 'ASC' },
      });

      for (const bc of activeBroadcasts) {
        if (!this.activeBroadcastIds.has(bc.id)) {
          this.activeBroadcastIds.add(bc.id);
          this.runBroadcastLoop(bc.id).catch((err) => {
            this.logger.error(`Error in broadcast loop for ${bc.id}`, err);
          }).finally(() => {
            this.activeBroadcastIds.delete(bc.id);
          });
        }
      }
    } catch (err) {
      this.logger.error('Error in broadcast queue loop', err);
    }
  }

  private async runBroadcastLoop(bcId: string) {
    try {
      while (true) {
        const bc = await this.broadcastRepo.findOne({ where: { id: bcId } });
        if (!bc || !['queued', 'running'].includes(bc.status)) {
          break;
        }

        if (!bc.sessionId) {
          this.logger.warn(`Broadcast ${bc.id} has no sessionId. Pausing.`);
          bc.status = 'paused';
          await this.broadcastRepo.save(bc);
          break;
        }

        if (bc.status === 'queued') {
          bc.status = 'running';
          if (!bc.startedAt) {
            bc.startedAt = new Date().toISOString();
          }
          await this.broadcastRepo.save(bc);
        }

        // Prioritize 'queued' recipients first so initial pass completes before retries
        let recipient = await this.recipientRepo.findOne({
          where: { broadcastId: bc.id, status: 'queued' },
          order: { createdAt: 'ASC' },
        });

        // If no queued recipients left, check for 'retrying' recipients whose retry interval has elapsed
        if (!recipient && bc.retryEnabled) {
          const retryingRecipient = await this.recipientRepo.findOne({
            where: { broadcastId: bc.id, status: 'retrying' },
            order: { updatedAt: 'ASC' },
          });

          if (retryingRecipient && retryingRecipient.updatedAt) {
            const lastAttemptTime = new Date(retryingRecipient.updatedAt).getTime();
            const intervalMs = (bc.retryIntervalHours || 24) * 3600 * 1000;
            if (Date.now() - lastAttemptTime >= intervalMs) {
              recipient = retryingRecipient;
            }
          }
        }

        if (!recipient) {
          await this.refreshStatsAndComplete(bc.id);
          break;
        }

        // Calculate sequential contact index before updating status
        const wasQueued = recipient.status === 'queued';
        const contactIndex = wasQueued
          ? Math.max(1, bc.totalCount - bc.queuedCount + 1)
          : Math.min(bc.totalCount, bc.sentCount + bc.failedCount + bc.skippedCount + 1);

        // 1. Enforce daytime sending hours (8:00 AM to 10:00 PM local time) to protect sender trust score
        const currentHour = new Date().getHours();
        if (currentHour < 8 || currentHour >= 22) {
          const now = new Date();
          const target = new Date(now);
          target.setHours(8, 0, 0, 0);
          if (currentHour >= 22) target.setDate(target.getDate() + 1);
          
          const sleepSeconds = (target.getTime() - now.getTime()) / 1000;
          this.logger.warn(`Broadcast ${bc.id}: Current time (${currentHour}:00) is outside normal daytime hours (8am - 10pm). Sleeping until 8am.`);
          
          bc.isSleeping = true;
          bc.sleepReason = 'Outside daytime sending hours (8am - 10pm)';
          bc.sleepUntil = target.toISOString();
          await this.broadcastRepo.save(bc);

          await new Promise((resolve) => setTimeout(resolve, sleepSeconds * 1000));
          
          bc.isSleeping = false;
          bc.sleepReason = '';
          bc.sleepUntil = '';
          await this.broadcastRepo.save(bc);
          continue;
        }

        // 2. Enforce Daily Cap (safety backstop: 250 messages/day max across all broadcasts)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todaySentCount = await this.recipientRepo
          .createQueryBuilder('r')
          .where('r.status IN (:...statuses)', { statuses: ['sent', 'delivered', 'read'] })
          .andWhere('r.sentAt >= :startOfDay', { startOfDay: startOfDay.toISOString() })
          .getCount();

        if (todaySentCount >= 250) {
          const now = new Date();
          const target = new Date(now);
          target.setDate(target.getDate() + 1);
          target.setHours(8, 0, 0, 0); // Resume next day at 8am
          const sleepSeconds = (target.getTime() - now.getTime()) / 1000;
          
          this.logger.warn(`Broadcast ${bc.id}: Daily cap of 250 broadcast messages reached (${todaySentCount} sent today). Sleeping until tomorrow 8am.`);
          
          bc.isSleeping = true;
          bc.sleepReason = 'Daily limit of 250 messages reached';
          bc.sleepUntil = target.toISOString();
          await this.broadcastRepo.save(bc);

          await new Promise((resolve) => setTimeout(resolve, sleepSeconds * 1000));
          
          bc.isSleeping = false;
          bc.sleepReason = '';
          bc.sleepUntil = '';
          await this.broadcastRepo.save(bc);
          continue;
        }

        // Mark recipient as sending
        recipient.status = 'sending';
        await this.recipientRepo.save(recipient);

        try {
          // 3. Initialize automatic humanized batch state for this broadcast if not present
          if (!this.batchState.has(bc.id)) {
            this.batchState.set(bc.id, {
              messagesInCurrentBatch: 0,
              currentBatchTarget: this.getRandomInt(30, 40), // Automatic batch size: 30-40 contacts
            });
          }
          const state = this.batchState.get(bc.id)!;

          // 4. Apply humanized timing and inter-batch breaks (skip delay before the very first contact overall so broadcast starts immediately)
          if (contactIndex > 1) {
            if (state.messagesInCurrentBatch >= state.currentBatchTarget) {
              // Reached batch threshold: take a 10-15 minute randomized break between batches
              const breakMinutes = this.getRandomInt(10, 15);
              const breakSeconds = breakMinutes * 60;
              
              bc.isSleeping = true;
              bc.sleepReason = 'Taking a humanized break between batches';
              bc.sleepUntil = new Date(Date.now() + breakSeconds * 1000).toISOString();
              await this.broadcastRepo.save(bc);
              
              this.logger.log(`Broadcast ${bc.id} completed batch of ${state.messagesInCurrentBatch} contacts. Taking a humanized break of ${breakMinutes} minutes (${breakSeconds}s) before next batch...`);
              await new Promise((resolve) => setTimeout(resolve, breakSeconds * 1000));
              
              bc.isSleeping = false;
              bc.sleepReason = '';
              bc.sleepUntil = '';
              await this.broadcastRepo.save(bc);

              // Reset batch counter for the next window with a new random target (30-40)
              state.messagesInCurrentBatch = 0;
              state.currentBatchTarget = this.getRandomInt(30, 40);
            } else {
              // Normal inter-message delay: 30-60 seconds randomized (never a fixed interval)
              const delaySeconds = this.getRandomInt(30, 60);
              this.logger.log(`Broadcast ${bc.id} waiting humanized random delay of ${delaySeconds}s before contact #${contactIndex}...`);
              await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
            }
          }

          // Re-verify broadcast status after sleep in case user paused/cancelled it from dashboard
          const currentBc = await this.broadcastRepo.findOne({ where: { id: bc.id } });
          if (!currentBc || !['queued', 'running'].includes(currentBc.status)) {
            recipient.status = recipient.retryCount > 0 ? 'retrying' : 'queued';
            await this.recipientRepo.save(recipient);
            break;
          }

          let cleanPhone = (recipient.phone || '').replace(/[^0-9]/g, '');
          if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone; // Auto-prepend Indian country code if missing
          }
          const chatId = `${cleanPhone}@c.us`;
          let messageId: string | undefined;
          let realTemplateName = bc.name;

          if (bc.messageType === 'template' && bc.templateId) {
            try {
              const template = await this.templateService.resolve(bc.sessionId, { templateId: bc.templateId });
              realTemplateName = template.name;
            } catch (err) {
              this.logger.warn(`Could not resolve template name for broadcast ${bc.id}, using broadcast name as fallback.`);
            }
            
            const vars = bc.templateVariables ? this.personalizeObject(bc.templateVariables, recipient) : {};
            if (!vars.name) {
              vars.name = recipient.name || 'there';
            }

            const res = await this.messageService.sendTemplate(bc.sessionId, {
              chatId,
              templateId: bc.templateId,
              vars,
            });
            messageId = res.messageId;
          } else if (bc.messageType === 'text' && bc.simpleText) {
            const personalizedText = this.personalizeMessage(bc.simpleText, recipient);
            const res = await this.messageService.sendText(bc.sessionId, {
              chatId,
              text: personalizedText,
            });
            messageId = res.messageId;
          } else if (['image', 'video', 'document', 'audio', 'file'].includes(bc.messageType) && bc.mediaUrl) {
            this.logger.warn(`Media sending not fully mapped for url ${bc.mediaUrl}`);
            throw new Error('Media sending via Broadcast requires accessible URL, falling back to fail.');
          } else {
            throw new Error(`Unsupported messageType or missing content: ${bc.messageType}`);
          }

          recipient.status = 'sent';
          recipient.sentAt = new Date().toISOString();
          recipient.messageId = messageId;
          await this.recipientRepo.save(recipient);

          try {
            await this.inboxService.createConversation(bc.sessionId, {
              chatId,
              contactId: recipient.contactId || undefined,
              campaignId: bc.id,
              templateId: bc.templateId || undefined,
              templateName: realTemplateName,
              contactName: recipient.name || cleanPhone,
              contactPhone: cleanPhone,
              initialMessageBody: bc.messageType === 'template' ? `[Template: ${realTemplateName}]` : (this.personalizeMessage(bc.simpleText || '', recipient)),
            });
          } catch (e) {
            this.logger.error(`Failed to create conversation in inbox for recipient ${recipient.id}`, e);
          }

        } catch (err: any) {
          this.logger.error(`Failed to send broadcast recipient ${recipient.id}`, err);

          recipient.retryCount += 1;
          let errorMsg = err.message || String(err);
          // WhatsApp web minified errors usually appear as single letters or generic evaluation failures
          if (errorMsg === 't' || errorMsg === 'e' || errorMsg === 'Error: t' || errorMsg === 'Error: e' || errorMsg.includes('Evaluation failed') || errorMsg.includes('No LID for user')) {
            errorMsg = 'Invalid number format or not registered on WhatsApp. Ensure it includes the country code (e.g., 91...)';
          }
          recipient.errorReason = errorMsg;

          const isInvalidNumber = this.isInvalidWhatsAppNumberError(err);
          if (bc.retryEnabled && !isInvalidNumber && recipient.retryCount <= bc.retryCount) {
            recipient.status = 'retrying';
          } else {
            recipient.status = 'failed';
          }
          await this.recipientRepo.save(recipient);
        }

        if (this.batchState.has(bc.id)) {
          this.batchState.get(bc.id)!.messagesInCurrentBatch += 1;
        }

        await this.refreshStatsAndComplete(bc.id);
      }
    } catch (err) {
      this.logger.error(`Error in runBroadcastLoop for ${bcId}`, err);
    } finally {
      this.batchState.delete(bcId);
    }
  }

  private isInvalidWhatsAppNumberError(err: any): boolean {
    if (!err) return false;
    const msg = (err.message || String(err)).toLowerCase();
    return (
      msg.includes('no lid for user') ||
      msg.includes('not registered') ||
      msg.includes('not exist') ||
      msg.includes('not a whatsapp number') ||
      msg.includes('invalid jid') ||
      msg.includes('invalid_jid') ||
      msg.includes('item-not-found') ||
      msg.includes('invalid_user') ||
      msg.includes('404') ||
      msg.includes('number not registered') ||
      msg.includes('recipient is not registered')
    );
  }

  private async refreshStatsAndComplete(broadcastId: string) {
    const counts = await this.recipientRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('r.broadcastId = :broadcastId', { broadcastId })
      .groupBy('r.status')
      .getRawMany();

    const map: Record<string, number> = {};
    counts.forEach((row) => (map[row.status] = parseInt(row.count, 10)));

    const queuedCount = map['queued'] ?? 0;
    const sendingCount = map['sending'] ?? 0;
    const retryingCount = map['retrying'] ?? 0;
    const pending = queuedCount + sendingCount + retryingCount;
    const total = Object.values(map).reduce((a, b) => a + b, 0);

    const updateData: Partial<Broadcast> = {
      queuedCount,
      sentCount: map['sent'] ?? 0,
      deliveredCount: map['delivered'] ?? 0,
      readCount: map['read'] ?? 0,
      failedCount: map['failed'] ?? 0,
      skippedCount: map['skipped'] ?? 0,
    };

    const currentBc = await this.broadcastRepo.findOne({ where: { id: broadcastId }, select: ['status'] });
    if (currentBc && ['queued', 'running'].includes(currentBc.status)) {
      if (total > 0 && pending === 0) {
        updateData.status = 'completed';
        updateData.completedAt = new Date().toISOString();
      }
    }

    await this.broadcastRepo.update(broadcastId, updateData);
  }
}
