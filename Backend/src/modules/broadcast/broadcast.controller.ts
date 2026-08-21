import {
  Controller, Get, Post, Put, Delete, Param, Body, Query,
  HttpCode, HttpStatus, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../crm/guards/jwt-auth.guard';
import { BroadcastService } from './services/broadcast.service';
import { CreateBroadcastDto, UpdateBroadcastDto } from './dto/broadcast.dto';

@ApiTags('broadcasts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm/broadcasts')
export class BroadcastController {
  constructor(private readonly broadcastService: BroadcastService) {}

  // ── Dashboard ─────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get broadcast dashboard stats' })
  async getStats(@Req() req: any) {
    return this.broadcastService.getDashboardStats(req.user.id);
  }

  // ── Audience Preview ─────────────────────────────────────────────────────

  @Post('audience-count')
  @ApiOperation({ summary: 'Preview audience count for the given criteria' })
  async audienceCount(@Req() req: any, @Body() body: any) {
    return this.broadcastService.getAudienceCount(
      req.user.id,
      body.segmentIds ?? [],
      body.excludeSegmentIds ?? [],
      body.excludeContactIds ?? [],
      body.skipActiveWindow ?? false,
      body.sessionId,
    );
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new broadcast (draft)' })
  async create(@Req() req: any, @Body() dto: CreateBroadcastDto) {
    return this.broadcastService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all broadcasts' })
  async findAll(@Req() req: any) {
    return this.broadcastService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get broadcast by ID' })
  @ApiParam({ name: 'id', description: 'Broadcast ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.broadcastService.findOne(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update broadcast (only when draft/paused)' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBroadcastDto) {
    return this.broadcastService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a broadcast' })
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.broadcastService.remove(req.user.id, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a broadcast' })
  async duplicate(@Req() req: any, @Param('id') id: string) {
    return this.broadcastService.duplicate(req.user.id, id);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  @Post(':id/launch')
  @ApiOperation({ summary: 'Launch a broadcast' })
  async launch(@Req() req: any, @Param('id') id: string) {
    return this.broadcastService.launch(req.user.id, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a running broadcast' })
  async pause(@Req() req: any, @Param('id') id: string) {
    return this.broadcastService.pause(req.user.id, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused broadcast' })
  async resume(@Req() req: any, @Param('id') id: string) {
    return this.broadcastService.resume(req.user.id, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a broadcast' })
  async cancel(@Req() req: any, @Param('id') id: string) {
    return this.broadcastService.cancel(req.user.id, id);
  }

  // ── Recipients ────────────────────────────────────────────────────────────

  @Get(':id/recipients')
  @ApiOperation({ summary: 'Get paginated recipients for a broadcast' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getRecipients(
    @Req() req: any,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.broadcastService.getRecipients(
      req.user.id,
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // ── Report ────────────────────────────────────────────────────────────────

  @Get(':id/report')
  @ApiOperation({ summary: 'Get broadcast report' })
  async getReport(@Req() req: any, @Param('id') id: string) {
    return this.broadcastService.getReport(req.user.id, id);
  }

  // ── Activity ──────────────────────────────────────────────────────────────

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get broadcast activity log' })
  async getActivity(@Param('id') id: string) {
    return this.broadcastService.getActivity(id);
  }
}
