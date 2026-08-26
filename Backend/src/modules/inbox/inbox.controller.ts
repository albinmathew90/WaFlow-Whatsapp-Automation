import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../auth/decorators/auth.decorators';
import { InboxService, InboxEventPayload } from './inbox.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendReplyDto } from './dto/send-reply.dto';
import { UpdateConversationDto, AddTagDto, RemoveTagDto } from './dto/update-conversation.dto';

import { JwtAuthGuard } from '../crm/guards/jwt-auth.guard';

@ApiTags('inbox')
@SkipThrottle({ short: true, medium: true, long: true })
@Controller('crm/inbox')
@UseGuards(JwtAuthGuard)
export class InboxController {
  private readonly logger = new Logger(InboxController.name);

  constructor(private readonly inboxService: InboxService) {}

  // ─── SSE Real-time Stream ────────────────────────────────────────────────

  /**
   * Server-Sent Events endpoint for real-time inbox updates.
   * Client connects with ?sessionId=<sid> query param.
   */
  @Get('events')
  @Public()
  @ApiOperation({ summary: 'Subscribe to real-time inbox events via SSE' })
  @ApiQuery({ name: 'sessionId', required: true })
  sseEvents(@Query('sessionId') sessionId: string, @Req() req: Request, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (payload: InboxEventPayload) => {
      // Only send events relevant to this sessionId
      if (payload.sessionId && payload.sessionId !== sessionId) return;
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch {
        // Client may have disconnected
      }
    };

    // Send a heartbeat every 25s to keep the connection alive
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 25000);

    this.inboxService.events.on('inbox.event', sendEvent);

    req.on('close', () => {
      clearInterval(heartbeat);
      this.inboxService.events.off('inbox.event', sendEvent);
    });
  }

  // ─── Conversations ───────────────────────────────────────────────────────

  @Post('conversations')
  @ApiOperation({ summary: 'Create an inbox conversation (call after campaign send)' })
  @ApiQuery({ name: 'sessionId', required: true })
  async createConversation(
    @Query('sessionId') sessionId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.inboxService.createConversation(sessionId, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List inbox conversations' })
  @ApiQuery({ name: 'sessionId', required: true })
  @ApiQuery({ name: 'filter', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listConversations(
    @Query('sessionId') sessionId: string,
    @Query('filter') filter?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inboxService.listConversations({
      sessionId,
      filter,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a single conversation' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'sessionId', required: true })
  async getConversation(@Param('id') id: string, @Query('sessionId') sessionId: string) {
    return this.inboxService.findConversation(id, sessionId);
  }

  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Update conversation status/tags/archive/block' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'sessionId', required: true })
  async updateConversation(
    @Param('id') id: string,
    @Query('sessionId') sessionId: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.inboxService.updateConversation(id, sessionId, dto);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a conversation and all its messages' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'sessionId', required: true })
  async deleteConversation(@Param('id') id: string, @Query('sessionId') sessionId: string) {
    return this.inboxService.deleteConversation(id, sessionId);
  }

  // ─── Messages ────────────────────────────────────────────────────────────

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get paginated messages for a conversation' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'sessionId', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getMessages(
    @Param('id') id: string,
    @Query('sessionId') sessionId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inboxService.getMessages(
      id,
      sessionId,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }

  @Post('conversations/:id/reply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a reply from the Inbox operator interface' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'sessionId', required: true })
  async sendReply(
    @Param('id') id: string,
    @Query('sessionId') sessionId: string,
    @Body() dto: SendReplyDto,
  ) {
    return this.inboxService.sendReply(id, sessionId, dto);
  }

  @Delete('conversations/:id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete specific messages from a conversation in the CRM' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'sessionId', required: true })
  @ApiQuery({ name: 'ids', required: true, description: 'Comma-separated message IDs' })
  async deleteMessages(
    @Param('id') id: string,
    @Query('sessionId') sessionId: string,
    @Query('ids') ids: string,
  ) {
    if (!ids) return { deleted: 0 };
    const messageIds = ids.split(',').filter(Boolean);
    return this.inboxService.deleteMessages(id, sessionId, messageIds);
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  @Post('conversations/:id/mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark conversation as read (reset unread count)' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'sessionId', required: true })
  async markRead(@Param('id') id: string, @Query('sessionId') sessionId: string) {
    return this.inboxService.markRead(id, sessionId);
  }

  @Post('conversations/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a conversation' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'sessionId', required: true })
  async archive(@Param('id') id: string, @Query('sessionId') sessionId: string) {
    return this.inboxService.archiveConversation(id, sessionId);
  }

  @Post('conversations/:id/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block the contact in a conversation' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'sessionId', required: true })
  async blockContact(@Param('id') id: string, @Query('sessionId') sessionId: string) {
    return this.inboxService.blockContact(id, sessionId);
  }

  @Post('conversations/:id/tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a tag to a conversation' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'sessionId', required: true })
  async addTag(
    @Param('id') id: string,
    @Query('sessionId') sessionId: string,
    @Body() dto: AddTagDto,
  ) {
    return this.inboxService.addTag(id, sessionId, dto.tag);
  }

  @Delete('conversations/:id/tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a tag from a conversation' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'sessionId', required: true })
  async removeTag(
    @Param('id') id: string,
    @Query('sessionId') sessionId: string,
    @Body() dto: RemoveTagDto,
  ) {
    return this.inboxService.removeTag(id, sessionId, dto.tag);
  }

  @Get('conversations/:id/export')
  @ApiOperation({ summary: 'Export a conversation as JSON' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'sessionId', required: true })
  async exportChat(@Param('id') id: string, @Query('sessionId') sessionId: string) {
    return this.inboxService.exportChat(id, sessionId);
  }
}
