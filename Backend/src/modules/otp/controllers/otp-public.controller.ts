import { Controller, Post, Get, Body, Headers, HttpCode, Req, Param, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { OtpPublicService } from '../services/otp-public.service';

import { Public } from '../../auth/decorators/auth.decorators';

@Public()
@Controller('otp')
@UseGuards(ThrottlerGuard)
export class OtpPublicController {
  constructor(private readonly otpPublicService: OtpPublicService) {}

  @Post('send')
  @HttpCode(200)
  async sendOtp(
    @Req() req: Request,
    @Headers('x-api-key') secretKey: string,
    @Body() body: { applicationId: string; phone: string; templateId?: string; expiry?: number; metadata?: any }
  ) {
    try {
      return await this.otpPublicService.sendOtp(body.applicationId, secretKey, body.phone, body.templateId, body.expiry, body.metadata, req);
    } catch (e) {
      console.error('500 ERROR in sendOtp:', e);
      throw e;
    }
  }

  @Post('verify')
  @HttpCode(200)
  verifyOtp(
    @Req() req: Request,
    @Headers('x-api-key') secretKey: string,
    @Body() body: { applicationId: string; phone: string; requestId: string; otp: string }
  ) {
    return this.otpPublicService.verifyOtp(body.applicationId, secretKey, body.phone, body.requestId, body.otp, req);
  }

  @Post('resend')
  @HttpCode(200)
  resendOtp(
    @Req() req: Request,
    @Headers('x-api-key') secretKey: string,
    @Body() body: { applicationId: string; phone: string; previousRequestId: string; templateId?: string; expiry?: number; metadata?: any }
  ) {
    return this.otpPublicService.resendOtp(body.applicationId, secretKey, body.phone, body.previousRequestId, req, body.templateId, body.expiry, body.metadata);
  }

  @Get('status/:requestId')
  getOtpStatus(
    @Req() req: Request,
    @Headers('x-api-key') secretKey: string,
    @Headers('x-application-id') applicationId: string,
    @Param('requestId') requestId: string
  ) {
    return this.otpPublicService.getOtpStatus(applicationId, secretKey, requestId, req);
  }

  // Educational: A dummy endpoint to demonstrate how a customer's server receives a webhook
  @Post('dummy-webhook-receiver')
  dummyWebhookReceiver(@Body() payload: any) {
    console.log('\n\n======================================================');
    console.log('🎉 MAGICAL WEBHOOK RECEIVED FROM CONVOREACH!');
    console.log('======================================================');
    console.log('A customer just built this route to receive your data.');
    console.log('Here is the exact data we caught:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('======================================================\n\n');
    
    // We must return a 200 OK to tell ConvoReach we received it successfully!
    return { status: 'success', message: 'Webhook received loud and clear!' };
  }
}
