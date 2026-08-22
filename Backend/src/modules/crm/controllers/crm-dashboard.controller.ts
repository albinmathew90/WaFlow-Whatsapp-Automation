import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CrmDashboardService } from '../services/crm-dashboard.service';

@ApiTags('crm-dashboard')
@Controller('crm/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrmDashboardController {
  constructor(private readonly dashboardService: CrmDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics for the logged-in user' })
  @ApiResponse({ status: 200, description: 'Dashboard stats successfully retrieved.' })
  async getStats(@Request() req: any) {
    return this.dashboardService.getDashboardStats(req.user.id || req.user.userId);
  }
}
