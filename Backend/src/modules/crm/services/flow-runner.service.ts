import { Injectable, Logger, Optional, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { CrmFlow } from '../entities/crm-flow.entity';
import { CrmFlowState } from '../entities/crm-flow-state.entity';
import { CrmFlowsService } from './crm-flows.service';
import { CrmTagsService } from './crm-tags.service';
import { CrmContactsService } from './crm-contacts.service';
import { MessageService } from '../../message/message.service';
import { HookManager } from '../../../core/hooks';

const SESSION_EXPIRY_MINUTES = 30;

/**
 * FlowRunnerService
 * -----------------
 * Called by InboxService on every incoming message.
 * It either resumes an in-progress flow for this chat,
 * or checks if any enabled flow's trigger matches the message.
 *
 * Execution is synchronous within a single message-received event —
 * no background workers needed for v1.
 */
@Injectable()
export class FlowRunnerService implements OnModuleInit {
  private readonly logger = new Logger(FlowRunnerService.name);

  constructor(
    @InjectRepository(CrmFlowState, 'data')
    private readonly stateRepo: Repository<CrmFlowState>,
    private readonly flowsService: CrmFlowsService,
    private readonly hookManager: HookManager,
    private readonly contactsService: CrmContactsService,
    @Optional() private readonly messageService?: MessageService,
    @Optional() private readonly tagsService?: CrmTagsService,
  ) {}

  onModuleInit() {
    this.hookManager.register(
      'crm-flow-runner',
      'message:received',
      async (ctx) => {
        const data = ctx.data as Record<string, unknown>;
        const fromMe = data['fromMe'] === true || data['isFromMe'] === true;
        
        // Only run flows for incoming messages from leads
        if (fromMe) return { continue: true };

        const chatId = (data['chatId'] ?? data['from']) as string | undefined;
        if (!chatId) return { continue: true };

        const type = (data['type'] as string) ?? 'chat';
        let body = null;
        if (type === 'chat') {
          body = (data['body'] ?? data['text']) as string | null;
        } else {
          body = (data['caption'] ?? data['body']) as string | null;
        }

        if (body) {
          const sid = ctx.sessionId ?? 'default';
          let actualUserId = sid;

          if (sid !== 'default') {
            try {
              const sessionRecord = await this.stateRepo.manager
                .createQueryBuilder()
                .select('s.userId', 'userId')
                .from('sessions', 's')
                .where('s.id = :id', { id: sid })
                .getRawOne();
              
              if (sessionRecord && sessionRecord.userId) {
                actualUserId = sessionRecord.userId;
              }
            } catch (e) {
              this.logger.error('Failed to resolve actual userId for session', e);
            }
          }
          
          const contactData = data['contact'] as Record<string, unknown> | undefined;
          const fallbackName = (contactData?.name ?? contactData?.pushName ?? contactData?.shortName ?? data['pushName'] ?? data['notifyName'] ?? data['name']) as string | undefined;

          await this.handle({
            userId: actualUserId,
            sessionId: sid,
            chatId,
            messageBody: body,
            messageType: type,
            fallbackName,
          }).catch(err => this.logger.error(`Flow execution failed for ${chatId}`, err));
        }

        return { continue: true };
      },
      300, // Execute after inbox-service
    );
  }

  /**
   * Main entry point called by InboxService after saving the incoming message.
   * userId comes from the InboxConversation's userId.
   */
  async handle(opts: {
    userId: string;
    sessionId: string;
    chatId: string;
    messageBody: string;
    messageType: string;
    fallbackName?: string;
  }): Promise<void> {
    try {
      const { userId, sessionId, chatId, messageBody, messageType } = opts;

      // 1. Check for in-progress flow state
      const existing = await this.stateRepo.findOne({ where: { userId, sessionId, chatId } });

      if (existing) {
        const ageMs = Date.now() - new Date(existing.updatedAt).getTime();
        const expired = ageMs > SESSION_EXPIRY_MINUTES * 60 * 1000;
        if (expired) {
          await this.stateRepo.delete(existing.id);
          // Falls through to trigger check below
        } else if (existing.waitingForReply) {
          // Resume the capture node — save the user's reply as the variable
          await this.resumeCaptureNode(existing, messageBody, sessionId, chatId, userId);
          return;
        } else {
          // Flow is active but between nodes (not waiting for a reply).
          // This can happen if the flow is executing synchronously.
          // Don't block the trigger check — let new triggers win.
        }
      }

      // 2. Check all enabled flows for a trigger match
      const flows = await this.flowsService.findAllEnabled(userId);
      for (const flow of flows) {
        if (this.matchesTrigger(flow.trigger, messageBody)) {
          await this.startFlow(flow, userId, sessionId, chatId, messageBody, opts.fallbackName);
          break; // first matching flow wins
        }
      }
    } catch (err) {
      this.logger.error('FlowRunnerService.handle error', err);
    }
  }

  // ─── Trigger Matching ──────────────────────────────────────────────────────

  private matchesTrigger(trigger: CrmFlow['trigger'], body: string): boolean {
    if (trigger.skipTrigger) return false;
    if (trigger.event === 'any') return true;
    if (trigger.event === 'keyword') {
      const text = trigger.caseSensitive ? body : body.toLowerCase();

      // Check regex first
      if (trigger.regex) {
        try {
          const flags = trigger.caseSensitive ? '' : 'i';
          const re = new RegExp(trigger.regex, flags);
          if (re.test(body)) return true;
        } catch (e) {
          this.logger.warn(`Invalid regex pattern in flow trigger: ${trigger.regex}`);
        }
      }

      // Check keywords
      if (trigger.keywords?.length) {
        const flatKeywords = trigger.keywords.flatMap(kw => kw.split(',').map(k => k.trim()).filter(Boolean));
        return flatKeywords.some((kw) => {
          const keyword = trigger.caseSensitive ? kw : kw.toLowerCase();
          return text.includes(keyword);
        });
      }
    }
    return false;
  }

  // ─── Flow Execution ─────────────────────────────────────────────────────────

  private async startFlow(flow: CrmFlow, userId: string, sessionId: string, chatId: string, initialMessageBody: string, fallbackName?: string): Promise<void> {
    const firstNodeId = this.findFirstNodeId(flow);
    if (!firstNodeId) return;

    // Delete any existing state for this chat before starting fresh.
    // This prevents UNIQUE constraint violations when a new trigger fires
    // while a non-waiting (between-nodes) state already exists.
    await this.stateRepo.delete({ userId, sessionId, chatId });

    const state = await this.stateRepo.save(
      this.stateRepo.create({
        userId,
        sessionId,
        chatId,
        flowId: flow.id,
        currentNodeId: firstNodeId,
        vars: {
          user_message: initialMessageBody || '',
          __fallbackName__: fallbackName || '',
        },
        waitingForReply: false,
      }),
    );

    await this.runNode(flow, state, sessionId, chatId);
  }

  private findFirstNodeId(flow: CrmFlow): string | undefined {
    // Check if there is an explicit edge from the UI Trigger Node
    const triggerEdge = flow.edges.find((e) => e.from === 'trigger_node');
    if (triggerEdge) return triggerEdge.to;

    // Fallback: The start node is the one that is not a target of any edge
    const targets = new Set(flow.edges.map((e) => e.to));
    return Object.keys(flow.nodes).find((id) => !targets.has(id));
  }

  private getNextNodeId(flow: CrmFlow, currentNodeId: string, branch?: string): string | undefined {
    const edge = flow.edges.find(
      (e) => e.from === currentNodeId && (branch ? e.branch === branch : !e.branch),
    );
    if (edge) return edge.to;
    // Fallback: only use any edge when no specific branch was requested
    // (i.e. for linear nodes without branching). For branching nodes (condition, list)
    // where a specific branch was requested but not found, return undefined to end flow.
    if (!branch) {
      const any = flow.edges.find((e) => e.from === currentNodeId);
      return any?.to;
    }
    return undefined;
  }

  private async advanceTo(flow: CrmFlow, state: CrmFlowState, nextNodeId: string | undefined, sessionId: string, chatId: string): Promise<void> {
    if (!nextNodeId || !flow.nodes[nextNodeId]) {
      // End of flow
      await this.stateRepo.delete(state.id);
      return;
    }
    state.currentNodeId = nextNodeId;
    state.waitingForReply = false;
    await this.stateRepo.save(state);
    await this.runNode(flow, state, sessionId, chatId);
  }

  private async runNode(flow: CrmFlow, state: CrmFlowState, sessionId: string, chatId: string): Promise<void> {
    const rawNode = flow.nodes[state.currentNodeId];
    if (!rawNode) {
      await this.stateRepo.delete(state.id);
      return;
    }

    // Support for block-based data structure in the frontend
    const node = rawNode.blocks?.length > 0 ? { ...rawNode, ...rawNode.blocks[0].data } : rawNode;

    let contact = await this.contactsService.findByPhone(state.userId, chatId);
    if (!contact) {
      const phoneFallback = chatId.split('@')[0];
      contact = await this.contactsService.findByPhone(state.userId, phoneFallback);
    }

    const enrichedVars = { ...state.vars };
    
    // Always provide phone from chatId as a baseline fallback
    const phoneFallback = chatId.split('@')[0];
    enrichedVars['contact.phoneno'] = enrichedVars['contact.phoneno'] ?? phoneFallback;
    enrichedVars['contact.phone'] = enrichedVars['contact.phone'] ?? phoneFallback;

    const fallbackName = state.vars['__fallbackName__'];
    if (fallbackName) {
      enrichedVars['contact.Name'] = enrichedVars['contact.Name'] ?? fallbackName;
      enrichedVars['contact.name'] = enrichedVars['contact.name'] ?? fallbackName;
    }

    if (contact) {
      enrichedVars['contact.firstName'] = contact.firstName || '';
      enrichedVars['contact.lastName'] = contact.lastName || '';
      enrichedVars['contact.Name'] = contact.firstName + (contact.lastName ? ' ' + contact.lastName : '');
      enrichedVars['contact.Email'] = contact.email || '';
      enrichedVars['contact.email'] = contact.email || '';
      enrichedVars['contact.phone'] = contact.phone || chatId.split('@')[0];
      enrichedVars['contact.phoneno'] = contact.phone || chatId.split('@')[0];
      if (contact.customFields) {
        for (const [k, v] of Object.entries(contact.customFields)) {
          enrichedVars[`contact.${k}`] = String(v);
        }
      }
    }

    switch (node.kind) {

      // ── Message nodes ──────────────────────────────────────────────────────

      case 'send_text':
      case 'text_button':
      case 'single_product':
      case 'catalog':
      case 'multi_product': {
        let text = this.interpolate(node.message || node.text || node.header || '', enrichedVars);
        text += this.formatButtons(node.buttons, enrichedVars);
        await this.sendText(sessionId, chatId, text);
        
        const hasQuickReplies = node.buttons?.some((b: any) => b.type === 'quick_reply' || !b.type);
        if (hasQuickReplies) {
          // Only pause and wait for reply if there are actual quick-reply buttons.
          // Link-only buttons don't need a reply — auto-advance to next node.
          state.waitingForReply = true;
          state.vars['__captureVar__'] = node.saveAs || 'answer';
          await this.stateRepo.save(state);
        } else {
          await this.advanceTo(flow, state, this.getNextNodeId(flow, state.currentNodeId), sessionId, chatId);
        }
        break;
      }

      case 'list': {
        const text = this.formatListMessage(node, enrichedVars);
        await this.sendText(sessionId, chatId, text);
        state.waitingForReply = true;
        state.vars['__captureVar__'] = node.saveAs || 'answer';
        await this.stateRepo.save(state);
        break;
      }

      case 'send_media':
      case 'media_button': {
        let caption = this.interpolate(node.caption || node.message || '', enrichedVars);
        caption += this.formatButtons(node.buttons, enrichedVars);
        const mediaUrl = node.mediaUrl || node.mediaFile?.url || '';
        if (mediaUrl) {
          await this.sendMediaMessage(sessionId, chatId, mediaUrl, caption);
        } else {
          await this.sendText(sessionId, chatId, caption);
        }
        await this.advanceTo(flow, state, this.getNextNodeId(flow, state.currentNodeId), sessionId, chatId);
        break;
      }

      case 'send_template':
      case 'template': {
        const templateId = node.templateId || node.selectedTemplate?.id;
        const templateName = node.templateName || node.selectedTemplate?.name;
        if (this.messageService && templateId) {
          try {
            await this.randomHumanJitter();
            await this.messageService.sendTemplate(sessionId, {
              chatId,
              templateId: templateId,
              templateName: templateName,
            });
          } catch (e) {
            this.logger.warn(`FlowRunner: failed to send template ${templateId}`, e);
          }
        }
        await this.advanceTo(flow, state, this.getNextNodeId(flow, state.currentNodeId), sessionId, chatId);
        break;
      }

      // ── Capture nodes ──────────────────────────────────────────────────────

      case 'ask_question':
      case 'ask_location': {
        const prompt = this.interpolate(node.prompt || '', enrichedVars);
        await this.sendText(sessionId, chatId, prompt);
        // Pause and wait for next reply
        state.waitingForReply = true;
        state.vars['__captureVar__'] = node.saveAs || 'answer';
        await this.stateRepo.save(state);
        break;
      }

      // ── Logic nodes ────────────────────────────────────────────────────────

      case 'condition': {
        const conditionOn = node.conditionOn || '';
        let result = false;

        if (conditionOn === 'user_message') {
          // Check the last captured reply first (set by ask_question / text_button capture).
          // Fall back to the initial user_message (the trigger keyword) if no capture var.
          const capturedAnswer = state.vars['answer'] || state.vars['user_message'] || '';
          const userMsg = capturedAnswer;
          const msgToCompare = (node.caseSensitive ? userMsg : userMsg.toLowerCase()).trim();
          const rawKeywords = node.keywords || [];
          const flatKeywords = rawKeywords.flatMap((k: string) => k.split(',').map(kw => kw.trim()).filter(Boolean));
          const keywords = flatKeywords.map((k: string) => node.caseSensitive ? k : k.toLowerCase());
          
          switch (node.op) {
            case 'eq':
              result = keywords.some((kw: string) => msgToCompare === kw);
              break;
            case 'contains':
              result = keywords.some((kw: string) => msgToCompare.includes(kw));
              break;
            case 'exists':
              result = !!userMsg.trim();
              break;
          }
        } else if (conditionOn === 'contact_custom_field') {
          const customFieldId = node.customFieldId;
          const customFields = contact?.customFields || {};
          const value = customFields[customFieldId] || '';

          switch (node.op) {
            case 'eq':
              result = value.toLowerCase() === (node.valueToCompare || '').toLowerCase();
              break;
            case 'exists':
              result = value !== null && value !== undefined && value.toString().trim() !== '';
              break;
            case 'time_in': {
              const now = new Date();
              const currentMins = now.getHours() * 60 + now.getMinutes();
              const [sh, sm] = (node.startTime || '00:00').split(':').map(Number);
              const [eh, em] = (node.endTime || '23:59').split(':').map(Number);
              const startMins = sh * 60 + sm;
              const endMins = eh * 60 + em;
              
              if (startMins <= endMins) {
                result = currentMins >= startMins && currentMins <= endMins;
              } else {
                // Crosses midnight
                result = currentMins >= startMins || currentMins <= endMins;
              }
              break;
            }
            case 'date_in': {
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const startDate = node.startDate ? new Date(node.startDate) : new Date(0);
              const endDate = node.endDate ? new Date(node.endDate) : new Date(8640000000000000); // Max date
              
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(0, 0, 0, 0);
              
              result = today >= startDate && today <= endDate;
              break;
            }
          }
        }

        const branch = result ? 'true' : 'false';
        await this.advanceTo(flow, state, this.getNextNodeId(flow, state.currentNodeId, branch), sessionId, chatId);
        break;
      }

      // ── Action nodes ────────────────────────────────────────────────────────


      case 'set_variable':
      case 'set_custom_field': {
        const val = this.interpolate(node.value || node.fieldValue || '', enrichedVars);
        const fieldName = node.field || node.variable || node.customFieldId || 'var';
        state.vars[fieldName] = val;
        
        await this.saveToContactDb(state.userId, chatId, fieldName, val, state.vars['__fallbackName__'] || '');
        
        await this.stateRepo.save(state);
        await this.advanceTo(flow, state, this.getNextNodeId(flow, state.currentNodeId), sessionId, chatId);
        break;
      }

      case 'connect_flow': {
        const targetFlowId = node.targetFlowId;
        if (!targetFlowId) {
          this.logger.warn(`FlowRunner: connect_flow missing targetFlowId`);
          await this.advanceTo(flow, state, this.getNextNodeId(flow, state.currentNodeId), sessionId, chatId);
          break;
        }

        const flows = await this.flowsService.findAllEnabled(state.userId);
        const targetFlow = flows.find(f => f.id === targetFlowId);
        
        if (!targetFlow) {
           this.logger.warn(`FlowRunner: Target flow ${targetFlowId} not found or disabled for user ${state.userId}`);
           await this.advanceTo(flow, state, this.getNextNodeId(flow, state.currentNodeId), sessionId, chatId);
           break;
        }

        const startNodeId = this.findFirstNodeId(targetFlow);
        if (!startNodeId) {
           this.logger.warn(`FlowRunner: Target flow ${targetFlowId} has no start node`);
           await this.advanceTo(flow, state, this.getNextNodeId(flow, state.currentNodeId), sessionId, chatId);
           break;
        }

        state.flowId = targetFlow.id;
        state.currentNodeId = startNodeId;
        await this.stateRepo.save(state);

        // Immediately execute the first node of the new flow
        await this.runNode(targetFlow, state, sessionId, chatId);
        return;
      }

      case 'end_flow': {
        await this.stateRepo.delete(state.id);
        break;
      }

      case 'api_request': {
        const webhookUrl = this.interpolate(node.webhookUrl || '', enrichedVars);
        if (webhookUrl) {
          const method = node.method || 'POST';
          const headersStr = this.interpolate(node.headers || '{}', enrichedVars);
          const bodyStr = this.interpolate(node.body || '{}', enrichedVars);
          
          let parsedHeaders: Record<string, string> = {};
          let parsedBody: string | undefined = undefined;
          
          try {
            if (headersStr.trim() && headersStr !== '{}') {
              parsedHeaders = JSON.parse(headersStr);
            }
          } catch (e) {
            this.logger.warn(`FlowRunner: invalid headers JSON in api_request`);
          }

          if (method !== 'GET' && method !== 'DELETE') {
            if (bodyStr.trim() && bodyStr !== '{}') {
              parsedBody = bodyStr;
            }
            if (!parsedHeaders['Content-Type']) {
              parsedHeaders['Content-Type'] = 'application/json';
            }
          }

          try {
            const res = await fetch(webhookUrl, {
              method,
              headers: parsedHeaders as HeadersInit,
              body: parsedBody
            });
            
            if (!res.ok) {
              const fallbackEdge = this.getNextNodeId(flow, state.currentNodeId, 'fallback');
              if (fallbackEdge) {
                await this.advanceTo(flow, state, fallbackEdge, sessionId, chatId);
                return;
              }
            }
          } catch (e) {
             this.logger.warn(`FlowRunner: api_request failed to ${webhookUrl}`, e);
             const fallbackEdge = this.getNextNodeId(flow, state.currentNodeId, 'fallback');
             if (fallbackEdge) {
               await this.advanceTo(flow, state, fallbackEdge, sessionId, chatId);
               return;
             }
          }
        }
        await this.advanceTo(flow, state, this.getNextNodeId(flow, state.currentNodeId), sessionId, chatId);
        break;
      }

      default:
        this.logger.warn(`FlowRunner: unknown node kind "${node.kind}", skipping`);
        await this.advanceTo(flow, state, this.getNextNodeId(flow, state.currentNodeId), sessionId, chatId);
    }
  }

  // ─── Capture node resume ───────────────────────────────────────────────────

  private async resumeCaptureNode(
    state: CrmFlowState,
    userReply: string,
    sessionId: string,
    chatId: string,
    userId: string,
  ): Promise<void> {
    // First try enabled flows; if the flow was disabled mid-session, load it directly so we can clean up gracefully.
    let flows = await this.flowsService.findAllEnabled(userId);
    let flow = flows.find((f) => f.id === state.flowId);
    if (!flow) {
      // Flow may have been disabled — load it directly to allow graceful cleanup
      const directFlow = await this.flowsService.findOne(userId, state.flowId);
      if (!directFlow) {
        await this.stateRepo.delete(state.id);
        return;
      }
      flow = directFlow;
    }

    let branch: string | undefined = undefined;
    let resolvedReply = userReply;
    const node = flow.nodes[state.currentNodeId];
    if (node) {
      const rawNode = node;
      const nodeData = rawNode.blocks?.length > 0 ? { ...rawNode, ...rawNode.blocks[0].data } : rawNode;
      const normalizedReply = userReply.trim().toLowerCase();
      
      if (nodeData.kind === 'list') {
        let matchedId = undefined;
        let itemIndex = 1;
        for (const section of nodeData.sections || []) {
          for (const item of section.items || []) {
            if (item.title.toLowerCase().trim() === normalizedReply || String(itemIndex) === normalizedReply) {
              matchedId = item.id;
              resolvedReply = item.title;
              break;
            }
            itemIndex++;
          }
          if (matchedId) break;
        }
        if (matchedId) branch = matchedId;
      } else if (nodeData.kind === 'text_button') {
        let matchedId = undefined;
        let btnIndex = 1;
        const quickReplies = (nodeData.buttons || []).filter((b: any) => b.type === 'quick_reply' || !b.type);
        for (const btn of quickReplies) {
          if (btn.name.toLowerCase().trim() === normalizedReply || String(btnIndex) === normalizedReply) {
            matchedId = btn.id;
            resolvedReply = btn.name;
            break;
          }
          btnIndex++;
        }
        if (matchedId) branch = matchedId;
      }
    }

    const captureVar = state.vars['__captureVar__'] || 'answer';
    state.vars[captureVar] = resolvedReply;
    // Always keep user_message updated to the latest reply so condition nodes
    // placed after a capture node can check against the most recent user input.
    state.vars['user_message'] = resolvedReply;
    delete state.vars['__captureVar__'];
    
    await this.saveToContactDb(userId, chatId, captureVar, resolvedReply, state.vars['__fallbackName__'] || '');
    
    state.waitingForReply = false;
    await this.stateRepo.save(state);

    const nextId = this.getNextNodeId(flow, state.currentNodeId, branch);
    await this.advanceTo(flow, state, nextId, sessionId, chatId);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private formatButtons(buttons: any[] | undefined, enrichedVars: Record<string, string>): string {
    if (!buttons || !Array.isArray(buttons) || buttons.length === 0) return '';
    
    const quickReplies = buttons.filter(b => b.type === 'quick_reply' || !b.type);
    const links = buttons.filter(b => b.type === 'link');
    
    let result = '';
    
    if (quickReplies.length > 0) {
      result += '\n\n⚡ *Please reply with the number of your option:*\n';
      quickReplies.forEach((b, i) => {
        result += `\n${i + 1}. ${this.interpolate(b.name, enrichedVars)}`;
      });
    }

    if (links.length > 0) {
      result += '\n\n' + links.map(b => {
        const url = b.url || '';
        const isPhone = url.includes('wa.me') || url.includes('tel:');
        const emoji = isPhone ? '☎️' : '🌐';
        return `${emoji} *${b.name}:* ${url}`;
      }).join('\n\n');
    }

    if (quickReplies.length > 0) {
      const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      const formatted = quickReplies.map((b: any, i: number) => {
        const emoji = i < 10 ? numberEmojis[i] : `${i + 1}.`;
        return `${emoji} [ ${b.name} ]`;
      }).join('\n');
      
      if (links.length > 0) {
        result += '\n\n━━━━━━━━━━━━━━━━━━\n';
      } else {
        result += '\n\n';
      }
      
      result += `⚡ *QUICK REPLIES*\n_Reply with an option below:_\n\n${formatted}`;
    }

    return result;
  }

  private formatListMessage(node: any, enrichedVars: Record<string, string>): string {
    let result = '';
    
    if (node.header) {
      result += `*${this.interpolate(node.header, enrichedVars)}*\n\n`;
    }
    
    if (node.body || node.message || node.text) {
      result += `${this.interpolate(node.body || node.message || node.text, enrichedVars)}\n\n`;
    }
    
    if (node.sections && Array.isArray(node.sections) && node.sections.length > 0) {
      if (node.buttonText) {
        result += `*${this.interpolate(node.buttonText, enrichedVars)}*\n_Please reply with the number of your choice:_\n`;
      } else {
        result += `*Please reply with the number of your choice:*\n`;
      }
      
      let itemIndex = 1;
      
      node.sections.forEach((section: any) => {
        if (section.title) {
          result += `\n*${this.interpolate(section.title, enrichedVars).toUpperCase()}*\n`;
        }
        
        if (section.items && Array.isArray(section.items)) {
          section.items.forEach((item: any) => {
            result += `${itemIndex}. ${this.interpolate(item.title, enrichedVars)}\n`;
            itemIndex++;
          });
        }
      });
    }

    if (node.footer) {
      result += `\n_${this.interpolate(node.footer, enrichedVars)}_`;
    }
    
    return result.trim();
  }

  private async saveToContactDb(userId: string, chatId: string, fieldName: string, value: string, fallbackName: string): Promise<void> {
    try {
      const phoneFallback = chatId.split('@')[0];
      let contact = await this.contactsService.findByPhone(userId, chatId);
      if (!contact) {
        contact = await this.contactsService.findByPhone(userId, phoneFallback);
      }
      
      if (!contact) {
        contact = await this.contactsService.create(userId, {
          phone: phoneFallback,
          firstName: fallbackName || '',
          customFields: {}
        });
      }

      const updateDto: any = {};
      const f = fieldName.toLowerCase();
      
      if (f === 'name' || f === 'firstname') {
        updateDto.firstName = value;
      } else if (f === 'lastname') {
        updateDto.lastName = value;
      } else if (f === 'email') {
        updateDto.email = value;
      } else if (f === 'phone' || f === 'phoneno' || f === 'phonenumber') {
        updateDto.phone = value;
      } else {
        updateDto.customFields = {
          ...(contact.customFields || {}),
          [fieldName]: value
        };
      }

      await this.contactsService.update(userId, contact.id, updateDto);
    } catch (e) {
      this.logger.warn(`FlowRunner: failed to save custom field ${fieldName} to contact DB`, e);
    }
  }

  private async randomHumanJitter(): Promise<void> {
    const minDelay = 2000;
    const maxDelay = 4500;
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    if (!template) return '';
    return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key) => {
      // 1. If key is 'contact.X', check if we have a fresh 'X' captured in the flow
      if (key.startsWith('contact.')) {
        const rawKey = key.replace('contact.', '');
        if (vars[rawKey] !== undefined && vars[rawKey] !== '') {
          return vars[rawKey];
        }
      }

      // 2. Otherwise use the exact key if it exists and is not empty
      if (vars[key] !== undefined && vars[key] !== '') {
        return vars[key];
      }

      // 3. Fallback to empty string if it exists but is empty (e.g. database value)
      if (vars[key] !== undefined) {
        return vars[key];
      }
      
      return `{{${key}}}`;
    });
  }

  private async sendText(sessionId: string, chatId: string, text: string): Promise<void> {
    if (!this.messageService || !text?.trim()) return;
    try {
      await this.randomHumanJitter();
      await this.messageService.sendText(sessionId, { chatId, text });
    } catch (e) {
      this.logger.warn(`FlowRunner: sendText failed for ${chatId}`, e);
    }
  }

  private async sendMediaMessage(sessionId: string, chatId: string, url: string, caption: string): Promise<void> {
    if (!this.messageService || !url?.trim()) return;
    try {
      await this.randomHumanJitter();
      
      const lowerUrl = url.toLowerCase();
      const isVideo = lowerUrl.match(/\.(mp4|mov|avi)$/);
      const isAudio = lowerUrl.match(/\.(mp3|ogg|wav)$/);
      const isDoc = lowerUrl.match(/\.(pdf|doc|docx|xls|xlsx)$/);
      
      const dto = { chatId, url, caption };
      
      if (isVideo) {
        await this.messageService.sendVideo(sessionId, dto);
      } else if (isAudio) {
        await this.messageService.sendAudio(sessionId, dto);
      } else if (isDoc) {
        await this.messageService.sendDocument(sessionId, dto);
      } else {
        await this.messageService.sendImage(sessionId, dto);
      }
    } catch (e) {
      this.logger.warn(`FlowRunner: sendMedia failed for ${chatId}`, e);
    }
  }

  /** Prune expired flow states. Can be called on a timer or startup. */
  async pruneExpiredStates(): Promise<void> {
    const cutoff = new Date(Date.now() - SESSION_EXPIRY_MINUTES * 60 * 1000);
    await this.stateRepo.delete({ updatedAt: LessThan(cutoff) });
  }
}
