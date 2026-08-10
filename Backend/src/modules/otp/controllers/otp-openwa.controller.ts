import { Controller, Get, Post, Body, Headers, HttpCode, Req, Param, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { OtpOpenwaService } from '../services/otp-openwa.service';
import { Public } from '../../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../../crm/guards/jwt-auth.guard';

@Public()
@Controller('otp-management/openwa')
@UseGuards(JwtAuthGuard)
export class OtpOpenwaController {
  constructor(private readonly otpOpenwaService: OtpOpenwaService) {}

  @Get('sessions')
  getSessions(
    @Req() req: Request,
    @Headers('x-api-key') secretKey: string,
    @Headers('x-application-id') applicationId: string
  ) {
    return this.otpOpenwaService.getSessions(applicationId, secretKey);
  }

  @Post('connect')
  @HttpCode(200)
  connectSession(
    @Req() req: Request,
    @Headers('x-api-key') secretKey: string,
    @Body() body: { applicationId: string; sessionName: string }
  ) {
    return this.otpOpenwaService.connectSession(body.applicationId, secretKey, body.sessionName);
  }

  @Post('disconnect')
  @HttpCode(200)
  disconnectSession(
    @Req() req: Request,
    @Headers('x-api-key') secretKey: string,
    @Body() body: { applicationId: string; sessionId: string }
  ) {
    return this.otpOpenwaService.disconnectSession(body.applicationId, secretKey, body.sessionId);
  }

  @Get('status')
  getStatus(
    @Req() req: Request,
    @Headers('x-api-key') secretKey: string,
    @Headers('x-application-id') applicationId: string
  ) {
    return this.otpOpenwaService.getStatus(applicationId, secretKey);
  }

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(@Body() payload: any) {
    return this.otpOpenwaService.handleWebhook(payload);
  }
}
