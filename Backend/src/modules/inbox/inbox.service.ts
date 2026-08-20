import {
  Injectable,
  OnModuleInit,
  Optional,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter } from 'events';
import {
  InboxConversation,
  ConversationStatus,
} from './entities/inbox-conversation.entity';
import {
  InboxMessage,
  InboxMessageDirection,
  InboxMessageType,
  InboxMessageStatus,
} from './entities/inbox-message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendReplyDto } from './dto/send-reply.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { HookManager } from '../../core/hooks';
import { MessageService } from '../message/message.service';

export interface InboxEventPayload {
  type: 'conversation_updated' | 'message_received' | 'conversation_created';
  sessionId: string;
  conversationId: string;
  data: unknown;
}

export interface ListConversationsOptions {
  sessionId: string;
  filter?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class InboxService implements OnModuleInit {
  private readonly logger = new Logger(InboxService.name);

  /** Internal bus: controllers subscribe to 'inbox.event' for SSE streaming */
  readonly events = new EventEmitter();

  constructor(
    @InjectRepository(InboxConversation, 'data')
    private readonly conversationRepo: Repository<InboxConversation>,
    @InjectRepository(InboxMessage, 'data')
    private readonly messageRepo: Repository<InboxMessage>,
    private readonly hookManager: HookManager,
    private readonly messageService: MessageService,
  ) {
    // Allow many SSE listeners without Node warning
    this.events.setMaxListeners(200);
  }

  onModuleInit() {
    // Subscribe to OpenWA's message:received hook
    this.hookManager.register(
      'inbox-service',
      'message:received',
      async (ctx) => {
        await this.handleIncomingMessage(ctx.data as Record<string, unknown>, ctx.sessionId);
        return { continue: true };
      },
      200,
    );

    // Subscribe to message:sent for tracking bot/api outgoing messages
    this.hookManager.register(
      'inbox-service',
      'message:sent',
      async (ctx) => {
        await this.handleOutgoingMessage(ctx.data as Record<string, unknown>, ctx.sessionId);
        return { continue: true };
      },
      200,
    );

    // Subscribe to message:ack for delivery tick updates
    this.hookManager.register(
      'inbox-service',
      'message:ack',
      async (ctx) => {
        await this.handleMessageAck(ctx.data as Record<string, unknown>, ctx.sessionId);
        return { continue: true };
      },
      200,
    );

    this.logger.log('InboxService initialised — listening on message:received, message:sent, message:ack');
  }

  // ─── Conversation Management ─────────────────────────────────────────────

  /**
   * Create a conversation record when a campaign/template is sent.
   * Idempotent: if a conversation already exists for (sessionId, chatId), returns it.
   */
  async createConversation(
    sessionId: string,
    dto: CreateConversationDto,
  ): Promise<InboxConversation> {
    let isNew = false;
    let conversation = await this.conversationRepo.findOne({
      where: { sessionId, chatId: dto.chatId },
    });

    if (conversation) {
      if (dto.campaignId) conversation.campaignId = dto.campaignId;
      if (dto.templateId) conversation.templateId = dto.templateId;
      if (dto.templateName) conversation.templateName = dto.templateName;
      if (dto.contactName && !conversation.contactName) conversation.contactName = dto.contactName;
      
      conversation.isArchived = false;
      if (dto.initialMessageBody) {
        conversation.lastMessageBody = dto.initialMessageBody;
        conversation.lastMessageDirection = 'outgoing';
        conversation.lastMessageAt = new Date();
      }
      conversation = await this.conversationRepo.save(conversation);
    } else {
      isNew = true;
      conversation = await this.conversationRepo.save(
        this.conversationRepo.create({
          sessionId,
          chatId: dto.chatId,
          contactId: dto.contactId ?? null,
          campaignId: dto.campaignId ?? null,
          templateId: dto.templateId ?? null,
          templateName: dto.templateName ?? null,
          contactName: dto.contactName ?? null,
          contactPhone: dto.contactPhone,
          profilePicUrl: null,
          lastMessageBody: dto.initialMessageBody ?? null,
          lastMessageDirection: 'outgoing',
          lastMessageAt: new Date(),
          unreadCount: 0,
          status: ConversationStatus.ACTIVE,
          isArchived: false,
          isBlocked: false,
          tags: [],
        })
      );
    }

    // Persist the initial outgoing message
    if (dto.initialMessageBody) {
      await this.messageRepo.save(
        this.messageRepo.create({
          conversationId: conversation.id,
          sessionId,
          direction: InboxMessageDirection.OUTGOING,
          type: InboxMessageType.TEXT,
          body: dto.initialMessageBody,
          status: InboxMessageStatus.SENT,
          timestamp: Math.floor(Date.now() / 1000),
        }),
      );
    }

    this.emitEvent({ type: isNew ? 'conversation_created' : 'conversation_updated', sessionId, conversationId: conversation.id, data: conversation });
    return conversation;
  }

  async listConversations(opts: ListConversationsOptions): Promise<{
    conversations: InboxConversation[];
    total: number;
  }> {
    const { sessionId, filter, search, limit = 30, offset = 0 } = opts;

    const qb = this.conversationRepo
      .createQueryBuilder('conv')
      .where('conv.sessionId = :sessionId', { sessionId });

    if (search?.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(conv.contactName) LIKE :term OR LOWER(conv.contactPhone) LIKE :term)',
        { term },
      );
    }

    switch (filter) {
      case 'unread':
        qb.andWhere('conv.unreadCount > 0');
        break;
      case 'replied':
        qb.andWhere('conv.status = :status', { status: ConversationStatus.REPLIED });
        break;
      case 'not_replied':
        qb.andWhere('conv.status = :status', { status: ConversationStatus.NOT_REPLIED });
        break;
      case 'interested':
        qb.andWhere('conv.status = :status', { status: ConversationStatus.INTERESTED });
        break;
      case 'follow_up':
        qb.andWhere('conv.status = :status', { status: ConversationStatus.FOLLOW_UP });
        break;
      case 'closed':
        qb.andWhere('conv.status = :status', { status: ConversationStatus.CLOSED });
        break;
      case 'archived':
        qb.andWhere('conv.isArchived = :archived', { archived: true });
        break;
      case 'tagged':
        qb.andWhere("conv.tags != '[]'");
        break;
      default:
        qb.andWhere('conv.isArchived = :archived', { archived: false });
    }

    qb.orderBy('conv.lastMessageAt', 'DESC').take(limit).skip(offset);

    const [conversations, total] = await qb.getManyAndCount();
    return { conversations, total };
  }

  async findConversation(id: string, sessionId: string): Promise<InboxConversation> {
    const conv = await this.conversationRepo.findOne({ where: { id, sessionId } });
    if (!conv) throw new NotFoundException(`Conversation ${id} not found`);
    return conv;
  }

  async findConversationByChatId(chatId: string, sessionId: string): Promise<InboxConversation | null> {
    return this.conversationRepo.findOne({ where: { chatId, sessionId } });
  }

  async findActiveChatIds(sessionId: string, hours: number): Promise<string[]> {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const conversations = await this.conversationRepo
      .createQueryBuilder('conv')
      .select('conv.chatId')
      .where('conv.sessionId = :sessionId', { sessionId })
      .andWhere('conv.lastMessageAt > :cutoffDate', { cutoffDate })
      .getMany();
    
    return conversations.map(c => c.chatId);
  }

  async updateConversation(id: string, sessionId: string, dto: UpdateConversationDto): Promise<InboxConversation> {
    const conv = await this.findConversation(id, sessionId);
    Object.assign(conv, dto);
    const saved = await this.conversationRepo.save(conv);
    this.emitEvent({ type: 'conversation_updated', sessionId, conversationId: id, data: saved });
    return saved;
  }

  async archiveConversation(id: string, sessionId: string): Promise<InboxConversation> {
    const conv = await this.findConversation(id, sessionId);
    conv.isArchived = true;
    conv.status = ConversationStatus.ARCHIVED;
    const saved = await this.conversationRepo.save(conv);
    this.emitEvent({ type: 'conversation_updated', sessionId, conversationId: id, data: saved });
    return saved;
  }

  async deleteMessages(conversationId: string, sessionId: string, messageIds: string[]): Promise<{ deleted: number }> {
    if (!messageIds || messageIds.length === 0) return { deleted: 0 };
    
    // Ensure the conversation belongs to this session
    await this.findConversation(conversationId, sessionId);

    // Using query builder for bulk delete
    const result = await this.messageRepo
      .createQueryBuilder()
      .delete()
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('sessionId = :sessionId', { sessionId })
      .andWhereInIds(messageIds)
      .execute();
      
    if (result.affected && result.affected > 0) {
      // Notify the frontend to remove these messages from the UI
      this.emitEvent({
        type: 'conversation_updated', // We can use conversation_updated or a new event. The UI can listen to conversation_updated with a custom payload or we can just send 'messages_deleted'. Let's use a custom event 'messages_deleted'. Wait, the UI doesn't handle 'messages_deleted' yet. I'll add 'messages_deleted' to the frontend.
        sessionId,
        conversationId,
        data: { deletedMessageIds: messageIds },
      } as any);
    }
    
    return { deleted: result.affected || 0 };
  }

  async blockContact(id: string, sessionId: string): Promise<InboxConversation> {
    const conv = await this.findConversation(id, sessionId);
    conv.isBlocked = true;
    const saved = await this.conversationRepo.save(conv);
    this.emitEvent({ type: 'conversation_updated', sessionId, conversationId: id, data: saved });
    return saved;
  }

  async markRead(id: string, sessionId: string): Promise<InboxConversation> {
    const conv = await this.findConversation(id, sessionId);
    conv.unreadCount = 0;
    const saved = await this.conversationRepo.save(conv);
    this.emitEvent({ type: 'conversation_updated', sessionId, conversationId: id, data: saved });
    return saved;
  }

  async addTag(id: string, sessionId: string, tag: string): Promise<InboxConversation> {
    const conv = await this.findConversation(id, sessionId);
    if (!conv.tags.includes(tag)) {
      conv.tags = [...conv.tags, tag];
      await this.conversationRepo.save(conv);
      this.emitEvent({ type: 'conversation_updated', sessionId, conversationId: id, data: conv });
    }
    return conv;
  }

  async removeTag(id: string, sessionId: string, tag: string): Promise<InboxConversation> {
    const conv = await this.findConversation(id, sessionId);
    conv.tags = conv.tags.filter((t) => t !== tag);
    const saved = await this.conversationRepo.save(conv);
    this.emitEvent({ type: 'conversation_updated', sessionId, conversationId: id, data: saved });
    return saved;
  }

  async deleteConversation(id: string, sessionId: string): Promise<void> {
    const conv = await this.findConversation(id, sessionId);
    await this.messageRepo.delete({ conversationId: id });
    await this.conversationRepo.remove(conv);
  }

  async exportChat(id: string, sessionId: string): Promise<{ conversation: InboxConversation; messages: InboxMessage[] }> {
    const conversation = await this.findConversation(id, sessionId);
    const messages = await this.messageRepo.find({
      where: { conversationId: id },
      order: { timestamp: 'ASC', createdAt: 'ASC' },
    });
    return { conversation, messages };
  }

  // ─── Message Retrieval ───────────────────────────────────────────────────

  async getMessages(
    conversationId: string,
    sessionId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ messages: InboxMessage[]; total: number }> {
    await this.findConversation(conversationId, sessionId);

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { conversationId },
      order: { timestamp: 'DESC', createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { messages: messages.reverse(), total };
  }

  // ─── Sending Replies ─────────────────────────────────────────────────────

  async sendReply(conversationId: string, sessionId: string, dto: SendReplyDto): Promise<InboxMessage> {
    const conv = await this.findConversation(conversationId, sessionId);

    if (conv.isBlocked) {
      throw new BadRequestException('Cannot send to a blocked contact');
    }

    // Persist the pending message including quoted context so it survives page navigations
    const pendingMsg = await this.messageRepo.save(
      this.messageRepo.create({
        conversationId,
        sessionId,
        direction: InboxMessageDirection.OUTGOING,
        type: this.mapReplyType(dto.type),
        body: dto.text ?? null,
        caption: dto.type !== 'text' ? dto.text ?? null : null,
        quotedMessageId: dto.quotedMessageId ?? null,
        quotedBody: dto.quotedBody ?? null,
        status: InboxMessageStatus.PENDING,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    );

    try {
      let result: Record<string, unknown>;

      switch (dto.type) {
        case 'text': {
          // Try with quoted reply first; if engine rejects it, fall back to plain send
          let sendResult: Record<string, unknown> | undefined;
          if (dto.quotedMessageId) {
            try {
              sendResult = (await this.messageService.sendText(sessionId, {
                chatId: conv.chatId,
                text: dto.text!,
                quotedMessageId: dto.quotedMessageId,
              })) as unknown as Record<string, unknown>;
            } catch (quoteErr) {
              this.logger.warn(
                `Quoted send failed for conversation ${conversationId}, retrying without quote: ${(quoteErr as Error)?.message}`,
              );
              // Fallback: send without quotedMessageId
              sendResult = (await this.messageService.sendText(sessionId, {
                chatId: conv.chatId,
                text: dto.text!,
              })) as unknown as Record<string, unknown>;
            }
          } else {
            sendResult = (await this.messageService.sendText(sessionId, {
              chatId: conv.chatId,
              text: dto.text!,
            })) as unknown as Record<string, unknown>;
          }
          result = sendResult!;
          break;
        }
        case 'image':
          result = (await this.messageService.sendImage(sessionId, {
            chatId: conv.chatId,
            base64: dto.mediaBase64!,
            mimetype: dto.mimeType,
            caption: dto.text,
            quotedMessageId: dto.quotedMessageId,
          })) as unknown as Record<string, unknown>;
          break;
        case 'video':
          result = (await this.messageService.sendVideo(sessionId, {
            chatId: conv.chatId,
            base64: dto.mediaBase64!,
            mimetype: dto.mimeType,
            caption: dto.text,
            quotedMessageId: dto.quotedMessageId,
          })) as unknown as Record<string, unknown>;
          break;
        case 'audio':
        case 'voice':
          result = (await this.messageService.sendAudio(sessionId, {
            chatId: conv.chatId,
            base64: dto.mediaBase64!,
            mimetype: dto.mimeType,
            ptt: dto.type === 'voice',
            quotedMessageId: dto.quotedMessageId,
          })) as unknown as Record<string, unknown>;
          break;
        case 'document':
          result = (await this.messageService.sendDocument(sessionId, {
            chatId: conv.chatId,
            base64: dto.mediaBase64!,
            filename: dto.mediaName,
            mimetype: dto.mimeType,
            caption: dto.text,
            quotedMessageId: dto.quotedMessageId,
          })) as unknown as Record<string, unknown>;
          break;
        case 'template':
          result = (await this.messageService.sendTemplate(sessionId, {
            chatId: conv.chatId,
            templateId: dto.templateId,
            templateName: dto.templateName,
            vars: dto.vars,
          })) as unknown as Record<string, unknown>;
          break;
        default:
          throw new BadRequestException(`Unsupported reply type: ${dto.type}`);
      }

      pendingMsg.status = InboxMessageStatus.SENT;
      if (result?.waMessageId) pendingMsg.waMessageId = result.waMessageId as string;
      await this.messageRepo.save(pendingMsg);

      await this.conversationRepo.update(conversationId, {
        lastMessageBody: dto.text ?? `[${dto.type}]`,
        lastMessageDirection: 'outgoing',
        lastMessageAt: new Date(),
        status: ConversationStatus.REPLIED,
      });

      this.emitEvent({ type: 'message_received', sessionId, conversationId, data: pendingMsg });
      return pendingMsg;
    } catch (error) {
      pendingMsg.status = InboxMessageStatus.FAILED;
      await this.messageRepo.save(pendingMsg);
      throw error;
    }
  }

  // ─── Incoming Webhook Handler ────────────────────────────────────────────

  async handleOutgoingMessage(data: Record<string, unknown>, sessionId?: string): Promise<void> {
    try {
      // Outgoing messages from Baileys typically have the recipient in `to` or `key.remoteJid`
      const chatId = (data['to'] ?? data['chatId']) as string | undefined;
      const sid = sessionId ?? (data['sessionId'] as string | undefined);

      if (!chatId || !sid) return;

      // Skip group chats — inbox is for 1:1 conversations only.
      if (chatId.endsWith('@g.us') || chatId.endsWith('@broadcast')) return;

      const isLidChat = chatId.endsWith('@lid');

      // Only process messages that have real user content: a text body or a media attachment.
      // System notifications, empty sync events, call logs, etc. have no body and no media
      // — creating a conversation from them produces the "No messages yet" ghost entries.
      const msgType = this.detectMessageType(data);
      const body = this.extractBody(data, msgType);
      const hasMedia = !!(
        (data['media'] as Record<string, unknown> | undefined)?.mimetype ||
        (data['media'] as Record<string, unknown> | undefined)?.url
      );
      const CONTENT_TYPES = new Set([
        InboxMessageType.TEXT, InboxMessageType.IMAGE, InboxMessageType.VIDEO,
        InboxMessageType.AUDIO, InboxMessageType.VOICE, InboxMessageType.DOCUMENT,
        InboxMessageType.STICKER, InboxMessageType.LOCATION, InboxMessageType.CONTACT_CARD,
      ]);
      if (!CONTENT_TYPES.has(msgType) && !hasMedia) return;
      if (msgType === InboxMessageType.TEXT && !body?.trim()) return;

      let conv = await this.findConversationByChatId(chatId, sid);
      
      if (!conv) {
        if (isLidChat) {
          // Skip creating a new conversation for an outgoing @lid message because we
          // cannot resolve the real phone number from an outgoing message event.
          // The conversation should be created by the first incoming message.
          return;
        }
        conv = await this.conversationRepo.save(
          this.conversationRepo.create({
            sessionId: sid,
            chatId,
            contactName: (data['notifyName'] ?? data['name']) as string || null,
            contactPhone: chatId.split('@')[0],
            lastMessageDirection: 'outgoing',
            lastMessageAt: new Date(),
            unreadCount: 0,
            status: ConversationStatus.ACTIVE,
            isArchived: false,
            isBlocked: false,
            tags: [],
          })
        );
        this.emitEvent({ type: 'conversation_created', sessionId: sid, conversationId: conv.id, data: conv });
      }

      if (conv.isBlocked) return;

      const waMessageId = (data['id'] ?? data['waMessageId']) as string | undefined;
      const timestamp = data['timestamp'] as number | undefined;

      // Deduplicate
      if (waMessageId) {
        const exists = await this.messageRepo.findOne({ where: { waMessageId, sessionId: sid } });
        if (exists) return;
      }

      const msg = await this.messageRepo.save(
        this.messageRepo.create({
          conversationId: conv.id,
          waMessageId: waMessageId ?? null,
          sessionId: sid,
          direction: InboxMessageDirection.OUTGOING,
          type: msgType,
          body: body ?? null,
          mediaUrl: (data['media'] as Record<string, unknown>)?.url as string ?? null,
          mediaName: (data['media'] as Record<string, unknown>)?.filename as string ?? null,
          mediaMimeType: (data['media'] as Record<string, unknown>)?.mimetype as string ?? null,
          quotedMessageId: (data['quotedMsgId'] ?? data['quotedMessageId']) as string ?? null,
          quotedBody: (data['quotedMsg'] as Record<string, unknown>)?.body as string ?? null,
          timestamp: timestamp ?? null,
          status: InboxMessageStatus.SENT,
          metadata: data,
        }),
      );

      const preview = body ?? this.typeLabel(msgType);
      await this.conversationRepo.update(conv.id, {
        lastMessageBody: preview,
        lastMessageDirection: 'outgoing',
        lastMessageAt: timestamp ? new Date(timestamp * 1000) : new Date(),
        status: ConversationStatus.REPLIED,
        unreadCount: 0,
      });

      const updatedConv = await this.conversationRepo.findOne({ where: { id: conv.id } });

      this.emitEvent({ type: 'message_received', sessionId: sid, conversationId: conv.id, data: { message: msg, conversation: updatedConv } });
    } catch (err) {
      this.logger.error('InboxService.handleOutgoingMessage error', err);
    }
  }

  async handleIncomingMessage(data: Record<string, unknown>, sessionId?: string): Promise<void> {
    try {
      const chatId = (data['chatId'] ?? data['from']) as string | undefined;
      const sid = sessionId ?? (data['sessionId'] as string | undefined);
      const senderPhone = data['senderPhone'] as string | undefined;

      if (!chatId || !sid) return;

      // Skip @lid contacts that WhatsApp has not resolved to a real phone number yet.
      // These are internal privacy IDs synced during history — creating a conversation
      // with a LID as the "phone" fills the inbox with meaningless 15-digit numbers.
      // Once the backend resolves the real number (via RESOLVE_LID_TO_PHONE) the
      // next incoming message from that contact will carry senderPhone and land correctly.
      const isLidChat = chatId.endsWith('@lid');
      if (isLidChat && !senderPhone) {
        return;
      }

      const fromMe = (data['fromMe'] === true || data['isFromMe'] === true);
      const contact = data['contact'] as Record<string, string> | undefined;
      const senderName = (contact?.name ?? contact?.pushName ?? contact?.shortName ?? data['pushName'] ?? data['notifyName'] ?? data['verifiedName'] ?? data['name']) as string | undefined;

      // Use the resolved real phone if available, otherwise fall back to chatId prefix.
      // For @lid senders we know senderPhone is set at this point (guarded above).
      const resolvedPhone = senderPhone ?? (isLidChat ? null : chatId.split('@')[0]);
      if (!resolvedPhone) return;

      // Skip group chats — inbox is for 1:1 conversations only.
      if (chatId.endsWith('@g.us') || chatId.endsWith('@broadcast')) return;

      // Only process messages that carry real user content.
      // System events ("end-to-end encrypted" notice, ephemeral change, etc.) and history-sync
      // notifications come in with no body and no media. Storing them produces the
      // "No messages yet" ghost conversations the user sees after reconnecting.
      const msgType = this.detectMessageType(data);
      const body = this.extractBody(data, msgType);
      const hasMedia = !!(
        (data['media'] as Record<string, unknown> | undefined)?.mimetype ||
        (data['media'] as Record<string, unknown> | undefined)?.url
      );
      const CONTENT_TYPES = new Set([
        InboxMessageType.TEXT, InboxMessageType.IMAGE, InboxMessageType.VIDEO,
        InboxMessageType.AUDIO, InboxMessageType.VOICE, InboxMessageType.DOCUMENT,
        InboxMessageType.STICKER, InboxMessageType.LOCATION, InboxMessageType.CONTACT_CARD,
      ]);
      if (!CONTENT_TYPES.has(msgType) && !hasMedia) return;
      if (msgType === InboxMessageType.TEXT && !body?.trim()) return;

      // Auto-create conversation for inbound messages so the Flow Builder works for new leads
      let conv = await this.findConversationByChatId(chatId, sid);
      
      // Also try matching by resolved phone in case the conversation was already created
      // under the real phone number (e.g. from a previous session or campaign send).
      if (!conv && resolvedPhone) {
        conv = await this.conversationRepo.findOne({
          where: { contactPhone: resolvedPhone, sessionId: sid },
          order: { lastMessageAt: 'DESC' }
        });
      }
      
      if (!conv) {
        conv = await this.conversationRepo.save(
          this.conversationRepo.create({
            sessionId: sid,
            chatId,
            contactName: senderName || null,
            contactPhone: resolvedPhone,
            lastMessageDirection: fromMe ? 'outgoing' : 'incoming',
            lastMessageAt: new Date(),
            unreadCount: 0,
            status: ConversationStatus.ACTIVE,
            isArchived: false,
            isBlocked: false,
            tags: [],
          })
        );
        this.emitEvent({ type: 'conversation_created', sessionId: sid, conversationId: conv.id, data: conv });
      }

      if (conv.isBlocked) return;

      const waMessageId = data['id'] as string | undefined;
      const timestamp = data['timestamp'] as number | undefined;

      // Deduplicate
      if (waMessageId) {
        const exists = await this.messageRepo.findOne({ where: { waMessageId, sessionId: sid } });
        if (exists) return;
      }

      const msg = await this.messageRepo.save(
        this.messageRepo.create({
          conversationId: conv.id,
          waMessageId: waMessageId ?? null,
          sessionId: sid,
          direction: fromMe ? InboxMessageDirection.OUTGOING : InboxMessageDirection.INCOMING,
          type: msgType,
          body: body ?? null,
          mediaUrl: (data['media'] as Record<string, unknown>)?.url as string ?? null,
          mediaName: (data['media'] as Record<string, unknown>)?.filename as string ?? null,
          mediaMimeType: (data['media'] as Record<string, unknown>)?.mimetype as string ?? null,
          quotedMessageId: ((data['quotedMessage'] as any)?.id ?? data['quotedMsgId'] ?? data['quotedMessageId'] ?? null) as string | null,
          quotedBody: ((data['quotedMessage'] as any)?.body ?? (data['quotedMsg'] as any)?.body ?? null) as string | null,
          timestamp: timestamp ?? null,
          status: InboxMessageStatus.READ,
          metadata: data,
        }),
      );

      const preview = body ?? this.typeLabel(msgType);
      
      const updatePayload: any = {
        lastMessageBody: preview,
        lastMessageDirection: fromMe ? 'outgoing' : 'incoming',
        lastMessageAt: timestamp ? new Date(timestamp * 1000) : new Date(),
      };
      
      // Update contact name if we found it but conversation was missing it
      if (senderName && (!conv.contactName || conv.contactName === conv.contactPhone)) {
        updatePayload.contactName = senderName;
      }
      
      // If the backend resolved a real phone number for a formerly-LID contact, upgrade the
      // stored contactPhone so future lookups and the UI show the real number.
      if (resolvedPhone && conv.contactPhone !== resolvedPhone) {
        updatePayload.contactPhone = resolvedPhone;
      }
      
      if (!fromMe) {
        updatePayload.unreadCount = () => '"unreadCount" + 1';
        updatePayload.status = ConversationStatus.NOT_REPLIED;
      }

      await this.conversationRepo.update(conv.id, updatePayload);

      // Re-read so we have fresh unreadCount for event payload
      const updatedConv = await this.conversationRepo.findOne({ where: { id: conv.id } });

      this.emitEvent({ type: 'message_received', sessionId: sid, conversationId: conv.id, data: { message: msg, conversation: updatedConv } });
    } catch (err) {
      this.logger.error('InboxService.handleIncomingMessage error', err);
    }
  }

  async handleMessageAck(data: Record<string, unknown>, sessionId?: string): Promise<void> {
    try {
      const waMessageId = (data['messageId'] ?? data['id']) as string | undefined;
      const ack = data['ack'] as number | undefined;
      const statusStr = data['status'] as string | undefined;
      const sid = sessionId ?? (data['sessionId'] as string | undefined);

      if (!waMessageId || !sid) return;

      const msg = await this.messageRepo.findOne({ where: { waMessageId, sessionId: sid } });
      if (!msg) return;

      const statusMap: Record<number, InboxMessageStatus> = {
        1: InboxMessageStatus.SENT,
        2: InboxMessageStatus.DELIVERED,
        3: InboxMessageStatus.READ,
        4: InboxMessageStatus.READ,
      };

      let newStatus: InboxMessageStatus | undefined;
      if (statusStr === 'sent') newStatus = InboxMessageStatus.SENT;
      else if (statusStr === 'delivered') newStatus = InboxMessageStatus.DELIVERED;
      else if (statusStr === 'read') newStatus = InboxMessageStatus.READ;
      else if (statusStr === 'failed') newStatus = InboxMessageStatus.FAILED;
      else if (ack !== undefined) newStatus = statusMap[ack];
      if (newStatus && msg.status !== newStatus) {
        msg.status = newStatus;
        await this.messageRepo.save(msg);
        this.emitEvent({
          type: 'conversation_updated',
          sessionId: sid,
          conversationId: msg.conversationId,
          data: { messageId: msg.id, status: newStatus },
        });
      }
    } catch (err) {
      this.logger.error('InboxService.handleMessageAck error', err);
    }
  }

  // ─── Internal Event Bus ──────────────────────────────────────────────────

  private emitEvent(payload: InboxEventPayload): void {
    setImmediate(() => {
      try {
        this.events.emit('inbox.event', payload);
      } catch {
        // Swallow — SSE listeners may have already disconnected
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private mapReplyType(type: string): InboxMessageType {
    const map: Record<string, InboxMessageType> = {
      text: InboxMessageType.TEXT,
      image: InboxMessageType.IMAGE,
      video: InboxMessageType.VIDEO,
      audio: InboxMessageType.AUDIO,
      voice: InboxMessageType.VOICE,
      document: InboxMessageType.DOCUMENT,
    };
    return map[type] ?? InboxMessageType.TEXT;
  }

  private detectMessageType(data: Record<string, unknown>): InboxMessageType {
    const type = data['type'] as string | undefined;
    const map: Record<string, InboxMessageType> = {
      chat: InboxMessageType.TEXT,
      image: InboxMessageType.IMAGE,
      video: InboxMessageType.VIDEO,
      audio: InboxMessageType.AUDIO,
      ptt: InboxMessageType.VOICE,
      document: InboxMessageType.DOCUMENT,
      sticker: InboxMessageType.STICKER,
      location: InboxMessageType.LOCATION,
      vcard: InboxMessageType.CONTACT_CARD,
    };
    return map[type ?? 'chat'] ?? InboxMessageType.TEXT;
  }

  private extractBody(data: Record<string, unknown>, type: InboxMessageType): string | null {
    if (type === InboxMessageType.TEXT) {
      return (data['body'] ?? data['text']) as string | null;
    }
    return (data['caption'] ?? data['body']) as string | null;
  }

  private typeLabel(type: InboxMessageType): string {
    const labels: Record<InboxMessageType, string> = {
      [InboxMessageType.TEXT]: '[Message]',
      [InboxMessageType.IMAGE]: '📷 Photo',
      [InboxMessageType.VIDEO]: '🎥 Video',
      [InboxMessageType.AUDIO]: '🎵 Audio',
      [InboxMessageType.VOICE]: '🎤 Voice message',
      [InboxMessageType.DOCUMENT]: '📄 Document',
      [InboxMessageType.STICKER]: '🌟 Sticker',
      [InboxMessageType.LOCATION]: '📍 Location',
      [InboxMessageType.CONTACT_CARD]: '👤 Contact',
      [InboxMessageType.UNKNOWN]: '[Unknown]',
    };
    return labels[type] ?? '[Message]';
  }
}
