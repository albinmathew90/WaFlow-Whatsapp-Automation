import { Injectable, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../crm/entities/user.entity';
import { PaymentHistory } from '../crm/entities/payment-history.entity';
import { AdminSettings } from '../admin/entities/admin-settings.entity';
const PDFDocument = require('pdfkit');

@Injectable()
export class PaymentService {
  private razorpay: any;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(User, 'data') private userRepository: Repository<User>,
    @InjectRepository(PaymentHistory, 'data') private paymentHistoryRepository: Repository<PaymentHistory>,
    @InjectRepository(AdminSettings, 'data') private adminSettingsRepository: Repository<AdminSettings>,
  ) {
    const key_id = this.configService.get('RAZORPAY_KEY_ID');
    const key_secret = this.configService.get('RAZORPAY_KEY_SECRET');
    if (key_id && key_secret) {
      this.razorpay = new Razorpay({ key_id, key_secret });
    } else {
      this.logger.warn('Razorpay keys not found in environment');
    }
  }

  async createOrder(userId: string, planType: string, couponCode?: string) {
    if (!this.razorpay) throw new InternalServerErrorException('Payment gateway not configured');
    
    let amount = 0;
    if (planType === 'monthly') amount = 24900; // Rs 249 * 100 paise
    else if (planType === 'yearly') amount = 149900; // Rs 1499 * 100 paise
    else throw new BadRequestException('Invalid plan type');

    if (couponCode) {
      const settings = await this.adminSettingsRepository.findOne({ where: { id: 1 } });
      if (settings && settings.planParameters && settings.planParameters.coupons) {
        const coupons = settings.planParameters.coupons;
        const matchedCoupon = coupons.find((c: any) => c.code && c.code.toLowerCase() === couponCode.toLowerCase());
        
        if (matchedCoupon) {
          if (matchedCoupon.maxRedemptions > 0) {
            const usageCount = await this.paymentHistoryRepository.count({
              where: { couponCode: matchedCoupon.code, status: 'success' }
            });
            if (usageCount >= matchedCoupon.maxRedemptions) {
              throw new BadRequestException('This promo code has reached its maximum redemption limit.');
            }
          }
          const basePrice = amount / 100;
          if (matchedCoupon.minOrderAmount && basePrice < matchedCoupon.minOrderAmount) {
            throw new BadRequestException(`Minimum order amount of ₹${matchedCoupon.minOrderAmount} not met for this coupon`);
          }
          if (matchedCoupon.maxOrderAmount && basePrice > matchedCoupon.maxOrderAmount) {
            throw new BadRequestException(`This coupon is not valid for orders over ₹${matchedCoupon.maxOrderAmount}`);
          }
          
          if (matchedCoupon.discountType === 'flat') {
            const flatDiscount = matchedCoupon.flatDiscountAmount || 0;
            amount = Math.max(100, amount - (flatDiscount * 100));
          } else {
            const discountPercentage = matchedCoupon.discountPercentage || 0;
            amount = Math.max(100, Math.floor(amount * (1 - (discountPercentage / 100))));
          }
        } else {
          throw new BadRequestException('Invalid promo code');
        }
      } else {
        throw new BadRequestException('Invalid promo code');
      }
    }

    const order = await this.razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `rcpt_${userId.substring(0,8)}_${Date.now()}`,
    });

    return order;
  }

  async verifyPayment(userId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string, planType: string, couponCode?: string) {
    const key_secret = this.configService.get('RAZORPAY_KEY_SECRET');
    
    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestException('Invalid signature');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const expiresAt = user.subscriptionStatus === 'active' && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date()
      ? new Date(user.subscriptionExpiresAt)
      : new Date();
      
    if (planType === 'monthly') {
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else if (planType === 'yearly') {
      expiresAt.setDate(expiresAt.getDate() + 365);
    }

    await this.userRepository.update(userId, {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: expiresAt,
      planType,
      razorpayOrderId
    });

    let paymentMethod = 'Unknown';
    let actualAmountPaid = planType === 'monthly' ? 24900 : 149900;
    try {
      const paymentDetails = await this.razorpay.payments.fetch(razorpayPaymentId);
      paymentMethod = paymentDetails.method || 'Unknown';
      if (paymentDetails.amount) {
        actualAmountPaid = paymentDetails.amount;
      }
    } catch (e) {
      this.logger.error('Failed to fetch razorpay payment details', e);
    }

    await this.paymentHistoryRepository.save({
      userId,
      amount: actualAmountPaid,
      planType,
      razorpayOrderId,
      razorpayPaymentId,
      status: 'success',
      paymentMethod,
      couponCode
    });

    return { success: true, expiresAt };
  }

  async getHistory(userId: string) {
    return this.paymentHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async generateReceiptPdf(userId: string, receiptId: string): Promise<Buffer> {
    const payment = await this.paymentHistoryRepository.findOne({ where: { id: receiptId, userId } });
    if (!payment) throw new BadRequestException('Receipt not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        const logoPath = require('path').join(process.cwd(), '../Frontend/public/logo-light.png');
        try {
          doc.image(logoPath, 35, 25, { width: 210 });
        } catch (e) {
          this.logger.error('Failed to load logo for PDF', e);
        }

        doc.fontSize(20).text('INVOICE / RECEIPT', { align: 'right' });
        doc.moveDown(2);

        // Company Details
        doc.fontSize(14).font('Helvetica-Bold').text('Waflow');
        doc.fontSize(10).font('Helvetica-Bold').text('DEVICE DOCTOR INDIA');
        doc.font('Helvetica').fontSize(10);
        doc.text('5R8R+G9P, Rawatbhata Road, Kota Airport Area, Gumanpura');
        doc.text('Kota, Rajasthan - 324007, India');
        doc.text('Website: waflow.devicedoctorindia.com');
        doc.moveDown(2);

        // Bill To
        doc.font('Helvetica-Bold').text('BILL TO:');
        doc.font('Helvetica').text(user?.name || user?.email || 'Customer');
        if (user?.email) doc.text(user.email);
        doc.moveDown(2);

        // Invoice Details
        doc.text(`Receipt ID: ${payment.id}`);
        doc.text(`Date: ${payment.createdAt.toLocaleDateString()}`);
        doc.text(`Razorpay Order ID: ${payment.razorpayOrderId || 'N/A'}`);
        doc.text(`Payment Status: ${payment.status.toUpperCase()}`);
        doc.moveDown(2);

        // Table Header
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Description', 50, tableTop);
        doc.text('Amount', 400, tableTop, { align: 'right', width: 100 });
        doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

        // Table Row
        doc.font('Helvetica');
        const planName = payment.planType === 'yearly' ? 'Waflow Yearly Subscription' : 'Waflow Monthly Subscription';
        const basePrice = payment.planType === 'yearly' ? 149900 : 24900;
        
        doc.text(planName, 50, tableTop + 30);
        doc.text(`Rs ${(basePrice / 100).toFixed(2)}`, 400, tableTop + 30, { align: 'right', width: 100 });

        let currentY = tableTop + 30;

        if (payment.amount < basePrice) {
          const discountAmount = basePrice - payment.amount;
          currentY += 20;
          doc.text('Discount Applied', 50, currentY);
          doc.text(`- Rs ${(discountAmount / 100).toFixed(2)}`, 400, currentY, { align: 'right', width: 100 });
        }

        // Total
        const totalY = currentY + 40;
        doc.moveTo(50, totalY - 10).lineTo(500, totalY - 10).stroke();
        doc.font('Helvetica-Bold');
        doc.text('TOTAL PAID:', 300, totalY);
        doc.text(`Rs ${(payment.amount / 100).toFixed(2)}`, 400, totalY, { align: 'right', width: 100 });

        // Payment Method Info
        doc.font('Helvetica').fontSize(10);
        doc.text(`Payment Method: Razorpay (${payment.paymentMethod || 'Online'})`, 50, totalY);

        // Footer
        doc.moveDown(4);
        doc.font('Helvetica-Oblique').fontSize(9).text('Thank you for subscribing to Waflow!', { align: 'center' });
        
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
