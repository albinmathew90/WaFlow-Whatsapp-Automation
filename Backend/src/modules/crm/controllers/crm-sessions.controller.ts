import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SessionService } from '../../session/session.service';
import { CreateSessionDto } from '../../session/dto/create-session.dto';
import { SessionResponseDto, QRCodeResponseDto } from '../../session/dto/session-response.dto';
import { MessageService } from '../../message/message.service';

/**
 * CRM-level session controller.
 * All endpoints require a valid JWT (crm_token). Sessions are always scoped to
 * the authenticated user — each user sees and manages ONLY their own sessions.
 */
@ApiTags('crm-sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm/sessions')
export class CrmSessionsController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly messageService: MessageService,
  ) {}

  private transformSession(session: any): SessionResponseDto {
    return SessionResponseDto.fromEntity(session);
  }

  /** Ensure the session belongs to the requesting user, throw 403 otherwise */
  private async getOwnedSession(id: string, userId: string) {
    const session = await this.sessionService.findOne(id);
    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this session');
    }
    return session;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new WhatsApp session owned by the current user' })
  async create(@Req() req: any, @Body() dto: CreateSessionDto): Promise<SessionResponseDto> {
    const session = await this.sessionService.create(dto, req.user.id);
    return this.transformSession(session);
  }

  @Get()
  @ApiOperation({ summary: 'List all WhatsApp sessions owned by the current user' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async findAll(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionService.findAll(undefined, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    }, req.user.id);
    return sessions.map(s => this.transformSession(s));
  }

  @Get('notifications/recent')
  @ApiOperation({ summary: 'Get recent incoming messages (notifications) for all user sessions' })
  async getRecentNotifications(@Req() req: any) {
    const sessions = await this.sessionService.findAll(undefined, {}, req.user.id);
    if (!sessions.length) return [];
    
    const sessionIds = sessions.map(s => s.id);
    return this.messageService.getRecentIncomingMessages(sessionIds, 20);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get session statistics for the current user' })
  async getStats(@Req() req: any) {
    // Get user's own sessions then compute stats
    const sessions = await this.sessionService.findAll(undefined, {}, req.user.id);
    const total = sessions.length;
    const byStatus: Record<string, number> = {};
    let ready = 0;
    let disconnected = 0;
    for (const s of sessions) {
      const key = s.status.toUpperCase();
      byStatus[key] = (byStatus[key] || 0) + 1;
      if (key === 'READY') ready++;
      if (key === 'DISCONNECTED') disconnected++;
    }
    const mem = process.memoryUsage();
    return {
      total,
      active: ready,
      ready,
      disconnected,
      byStatus,
      memoryUsage: { heapUsed: mem.heapUsed, heapTotal: mem.heapTotal, rss: mem.rss },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a session by ID (must be owned by current user)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any): Promise<SessionResponseDto> {
    const session = await this.getOwnedSession(id, req.user.id);
    return this.transformSession(session);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a session (must be owned by current user)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Req() req: any): Promise<void> {
    await this.getOwnedSession(id, req.user.id);
    await this.sessionService.delete(id);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a session (triggers QR generation)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async start(@Param('id', ParseUUIDPipe) id: string, @Req() req: any): Promise<SessionResponseDto> {
    await this.getOwnedSession(id, req.user.id);
    const session = await this.sessionService.start(id);
    return this.transformSession(session);
  }

  @Post(':id/stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop a session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async stop(@Param('id', ParseUUIDPipe) id: string, @Req() req: any): Promise<SessionResponseDto> {
    await this.getOwnedSession(id, req.user.id);
    const session = await this.sessionService.stop(id);
    return this.transformSession(session);
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Get QR code for session authentication' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async getQRCode(@Param('id', ParseUUIDPipe) id: string, @Req() req: any): Promise<QRCodeResponseDto> {
    await this.getOwnedSession(id, req.user.id);
    return this.sessionService.getQRCode(id);
  }
}
