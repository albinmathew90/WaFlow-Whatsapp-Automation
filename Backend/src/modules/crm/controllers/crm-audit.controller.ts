import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';

@ApiTags('crm-audit')
@Controller('crm/audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrmAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get non-security activity logs for the logged-in user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Audit logs successfully retrieved.' })
  async getLogs(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    // Filter out security events
    const excludeActions = [
      AuditAction.API_KEY_CREATED,
      AuditAction.API_KEY_UPDATED,
      AuditAction.API_KEY_USED,
      AuditAction.API_KEY_REVOKED,
      AuditAction.API_KEY_DELETED,
      AuditAction.API_KEY_AUTH_FAILED,
    ];

    return this.auditService.findAll({
      userId: req.user.userId || req.user.id, // Fallback depending on jwt payload
      excludeActions,
      limit: parsedLimit,
      offset: parsedOffset,
    });
  }
}
