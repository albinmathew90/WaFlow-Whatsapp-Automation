import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../crm/guards/jwt-auth.guard';
import { OtpManagementService } from '../services/otp-management.service';

import { Public } from '../../auth/decorators/auth.decorators';

@Controller('otp-management')
@UseGuards(JwtAuthGuard)
export class OtpManagementController {
  constructor(private readonly otpManagementService: OtpManagementService) {}

  @Post('applications')
  async createApplication(@Request() req: any, @Body() data: any) {
    try {
      return await this.otpManagementService.createApplication(req.user.id, data);
    } catch (e) {
      console.error('500 ERROR in createApplication:', e);
      throw e;
    }
  }

  @Get('applications')
  getApplications(@Request() req: any) {
    return this.otpManagementService.getApplications(req.user.id);
  }

  @Get('applications/:id')
  getApplication(@Request() req: any, @Param('id') id: string) {
    return this.otpManagementService.getApplication(req.user.id, id);
  }

  @Put('applications/:id')
  updateApplication(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.otpManagementService.updateApplication(req.user.id, id, data);
  }

  @Delete('applications/:id')
  deleteApplication(@Request() req: any, @Param('id') id: string) {
    return this.otpManagementService.deleteApplication(req.user.id, id);
  }

  @Post('applications/:id/rotate-api-key')
  rotateApiKey(@Request() req: any, @Param('id') id: string) {
    return this.otpManagementService.rotateApiKey(req.user.id, id);
  }

  @Post('applications/:id/rotate-secret')
  rotateSecretKey(@Request() req: any, @Param('id') id: string) {
    return this.otpManagementService.rotateSecretKey(req.user.id, id);
  }

  @Get('applications/:id/api-key-logs')
  getApiKeyLogs(@Request() req: any, @Param('id') id: string) {
    return this.otpManagementService.getApiKeyLogs(req.user.id, id);
  }

  @Post('applications/:id/rotate-webhook-secret')
  rotateWebhookSecret(@Request() req: any, @Param('id') id: string) {
    return this.otpManagementService.rotateWebhookSecret(req.user.id, id);
  }

  @Get('applications/:id/analytics')
  getAnalytics(@Request() req: any, @Param('id') id: string) {
    return this.otpManagementService.getAnalytics(req.user.id, id);
  }

  // Templates
  @Post('applications/:id/templates')
  createTemplate(@Request() req: any, @Param('id') appId: string, @Body() data: any) {
    return this.otpManagementService.createTemplate(req.user.id, appId, data);
  }

  @Get('applications/:id/templates')
  getTemplates(@Request() req: any, @Param('id') appId: string) {
    return this.otpManagementService.getTemplates(req.user.id, appId);
  }

  @Get('applications/:id/templates/:templateId')
  getTemplate(@Request() req: any, @Param('id') appId: string, @Param('templateId') templateId: string) {
    return this.otpManagementService.getTemplate(req.user.id, appId, templateId);
  }

  @Put('applications/:id/templates/:templateId')
  updateTemplate(@Request() req: any, @Param('id') appId: string, @Param('templateId') templateId: string, @Body() data: any) {
    return this.otpManagementService.updateTemplate(req.user.id, appId, templateId, data);
  }

  @Delete('applications/:id/templates/:templateId')
  deleteTemplate(@Request() req: any, @Param('id') appId: string, @Param('templateId') templateId: string) {
    return this.otpManagementService.deleteTemplate(req.user.id, appId, templateId);
  }

  @Post('applications/:id/templates/:templateId/duplicate')
  duplicateTemplate(@Request() req: any, @Param('id') appId: string, @Param('templateId') templateId: string) {
    return this.otpManagementService.duplicateTemplate(req.user.id, appId, templateId);
  }

  @Get('applications/:id/templates/:templateId/versions')
  getTemplateVersions(@Request() req: any, @Param('id') appId: string, @Param('templateId') templateId: string) {
    return this.otpManagementService.getTemplateVersions(req.user.id, appId, templateId);
  }

  @Post('applications/:id/templates/:templateId/restore')
  restoreTemplateVersion(@Request() req: any, @Param('id') appId: string, @Param('templateId') templateId: string, @Body('versionId') versionId: string) {
    return this.otpManagementService.restoreTemplateVersion(req.user.id, appId, templateId, versionId);
  }

  // Webhooks
  @Post('applications/:id/webhooks')
  createWebhook(@Request() req: any, @Param('id') appId: string, @Body() data: any) {
    return this.otpManagementService.createWebhook(req.user.id, appId, data);
  }

  @Get('applications/:id/webhooks')
  getWebhooks(@Request() req: any, @Param('id') appId: string) {
    return this.otpManagementService.getWebhooks(req.user.id, appId);
  }

  @Delete('applications/:id/webhooks/:webhookId')
  deleteWebhook(@Request() req: any, @Param('id') appId: string, @Param('webhookId') webhookId: string) {
    return this.otpManagementService.deleteWebhook(req.user.id, appId, webhookId);
  }

  @Post('applications/:id/webhooks/:webhookId/test')
  testWebhook(@Request() req: any, @Param('id') appId: string, @Param('webhookId') webhookId: string) {
    return this.otpManagementService.testWebhook(req.user.id, appId, webhookId);
  }

  // Logs
  @Get('applications/:id/logs')
  getLogs(@Request() req: any, @Param('id') appId: string) {
    return this.otpManagementService.getLogs(req.user.id, appId);
  }
}
