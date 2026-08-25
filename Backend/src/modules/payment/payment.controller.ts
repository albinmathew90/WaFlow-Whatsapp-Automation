import { Controller, Post, Body, UseGuards, Req, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../crm/guards/jwt-auth.guard';

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  async createOrder(@Req() req: any, @Body('planType') planType: string) {
    const userId = req.user.id;
    return this.paymentService.createOrder(userId, planType);
  }

  @Post('verify')
  async verifyPayment(
    @Req() req: any,
    @Body('razorpay_order_id') razorpayOrderId: string,
    @Body('razorpay_payment_id') razorpayPaymentId: string,
    @Body('razorpay_signature') razorpaySignature: string,
    @Body('planType') planType: string,
  ) {
    const userId = req.user.id;
    return this.paymentService.verifyPayment(userId, razorpayOrderId, razorpayPaymentId, razorpaySignature, planType);
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    const userId = req.user.id;
    return this.paymentService.getHistory(userId);
  }

  @Get('receipt/:id')
  async getReceipt(@Req() req: any, @Param('id') receiptId: string, @Res() res: Response) {
    const userId = req.user.id;
    const pdfBuffer = await this.paymentService.generateReceiptPdf(userId, receiptId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt_${receiptId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.end(pdfBuffer);
  }
}
