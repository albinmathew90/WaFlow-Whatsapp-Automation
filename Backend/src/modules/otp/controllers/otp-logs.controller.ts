import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../crm/guards/jwt-auth.guard';
import { OtpLogsService } from '../services/otp-logs.service';
import { OtpManagementService } from '../services/otp-management.service';

import { Public } from '../../auth/decorators/auth.decorators';

@Controller('otp-management/logs')
@UseGuards(JwtAuthGuard)
export class OtpLogsController {
  constructor(
    private readonly otpLogsService: OtpLogsService,
    private readonly otpManagementService: OtpManagementService
  ) {}

  @Get(':appId/otp')
  async getOtpLogs(
    @Request() req: any,
    @Param('appId') appId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    await this.otpManagementService.getApplication(req.user.id, appId);
    return this.otpLogsService.getOtpLogs(appId, limit ? Number(limit) : 50, offset ? Number(offset) : 0);
  }

  @Get(':appId/webhooks')
  async getWebhookLogs(
    @Request() req: any,
    @Param('appId') appId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    await this.otpManagementService.getApplication(req.user.id, appId);
    return this.otpLogsService.getWebhookLogs(appId, limit ? Number(limit) : 50, offset ? Number(offset) : 0);
  }

  @Get(':appId/audit')
  async getAuditLogs(
    @Request() req: any,
    @Param('appId') appId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    await this.otpManagementService.getApplication(req.user.id, appId);
    return this.otpLogsService.getAuditLogs(appId, limit ? Number(limit) : 50, offset ? Number(offset) : 0);
  }
}
