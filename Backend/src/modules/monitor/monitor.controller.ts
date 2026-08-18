import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { MonitorService } from './monitor.service';
import { RequireRole } from '../auth/decorators/auth.decorators';
import { ApiKeyRole } from '../auth/entities/api-key.entity';

@ApiTags('monitor')
@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Get(':sessionId/summary')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Get top-level health summary for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  async getSummary(
    @Param('sessionId') sessionId: string,
    @Query('timeRange') timeRange?: string,
    @Query('customDate') customDate?: string
  ) {
    return this.monitorService.getSummary(sessionId, timeRange, customDate);
  }

  @Get(':sessionId/stuck-contacts')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Get contacts stuck at SENT' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  async getStuckContacts(
    @Param('sessionId') sessionId: string,
    @Query('timeRange') timeRange?: string,
    @Query('customDate') customDate?: string
  ) {
    return this.monitorService.getStuckContacts(sessionId, timeRange, customDate);
  }

  @Post(':sessionId/contacts/action')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Perform bulk action on stuck contacts' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  async executeContactAction(
    @Param('sessionId') sessionId: string,
    @Body() body: { action: 'opt-out' | 'ignore'; chatIds: string[] }
  ) {
    if (body.action === 'opt-out') {
      return this.monitorService.markOptedOut(sessionId, body.chatIds);
    }
    // 'ignore' just acknowledges them without DB changes, frontend can hide them locally
    return { success: true, count: body.chatIds.length, ignored: true };
  }
}
