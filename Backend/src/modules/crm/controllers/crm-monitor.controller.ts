import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MonitorService } from '../../monitor/monitor.service';
import { SessionService } from '../../session/session.service';

/**
 * CRM-level monitor controller.
 * Proxies Health Monitor calls through the JWT-secured CRM layer,
 * replacing the insecure frontend → OpenWA Master API Key pattern.
 * All endpoints verify the requesting user owns the session before
 * delegating to MonitorService (which queries the local DB — no
 * external API key is needed).
 */
@ApiTags('crm-monitor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm/monitor')
export class CrmMonitorController {
  constructor(
    private readonly monitorService: MonitorService,
    private readonly sessionService: SessionService,
  ) {}

  /** Verify the session belongs to the requesting user, throw 403 otherwise */
  private async assertOwnership(sessionId: string, userId: string) {
    const session = await this.sessionService.findOne(sessionId);
    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this session');
    }
  }

  @Get(':sessionId/summary')
  @ApiOperation({ summary: 'Get health summary for a user-owned session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  async getSummary(
    @Param('sessionId') sessionId: string,
    @Query('timeRange') timeRange: string,
    @Query('customDate') customDate: string,
    @Req() req: any,
  ) {
    await this.assertOwnership(sessionId, req.user.id);
    return this.monitorService.getSummary(sessionId, timeRange, customDate);
  }

  @Get(':sessionId/stuck-contacts')
  @ApiOperation({ summary: 'Get stuck contacts for a user-owned session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  async getStuckContacts(
    @Param('sessionId') sessionId: string,
    @Query('timeRange') timeRange: string,
    @Query('customDate') customDate: string,
    @Req() req: any,
  ) {
    await this.assertOwnership(sessionId, req.user.id);
    return this.monitorService.getStuckContacts(sessionId, timeRange, customDate);
  }

  @Post(':sessionId/contacts/action')
  @ApiOperation({ summary: 'Perform bulk action on stuck contacts for a user-owned session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  async executeContactAction(
    @Param('sessionId') sessionId: string,
    @Body() body: { action: 'opt-out' | 'ignore'; chatIds: string[] },
    @Req() req: any,
  ) {
    await this.assertOwnership(sessionId, req.user.id);
    if (body.action === 'opt-out') {
      return this.monitorService.markOptedOut(sessionId, body.chatIds);
    }
    // 'ignore' just acknowledges them; frontend hides them locally
    return { success: true, count: body.chatIds.length, ignored: true };
  }
}
