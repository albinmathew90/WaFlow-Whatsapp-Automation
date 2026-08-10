import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../crm/guards/jwt-auth.guard';
import { OtpAnalyticsService } from '../services/otp-analytics.service';
import { OtpManagementService } from '../services/otp-management.service';

import { Public } from '../../auth/decorators/auth.decorators';

@Public()
@Controller('otp-management/analytics')
@UseGuards(JwtAuthGuard)
export class OtpAnalyticsController {
  constructor(
    private readonly otpAnalyticsService: OtpAnalyticsService,
    private readonly otpManagementService: OtpManagementService
  ) {}

  @Get(':appId/dashboard')
  async getDashboardSummary(@Request() req: any, @Param('appId') appId: string) {
    // Validate that the user owns the application
    await this.otpManagementService.getApplication(req.user.id, appId);
    return this.otpAnalyticsService.getDashboardSummary(appId);
  }

  @Get(':appId/charts')
  async getChartData(@Request() req: any, @Param('appId') appId: string) {
    await this.otpManagementService.getApplication(req.user.id, appId);
    return this.otpAnalyticsService.getChartData(appId, 30);
  }
}
