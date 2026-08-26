import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger('MailService');
  private transporter: nodemailer.Transporter;

  onModuleInit() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.logger.log(`Initializing MailService with SMTP host ${host}:${port}`);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      // Use a no-op dummy transporter immediately so startup is never blocked.
      // Attempt to upgrade to Ethereal in the background for dev email previews.
      this.transporter = nodemailer.createTransport({ streamTransport: true, newline: 'windows' });
      this.logger.log('No SMTP config found — using dummy transporter. Attempting Ethereal upgrade in background...');
      nodemailer.createTestAccount().then(testAccount => {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        this.logger.log(`Ethereal Mail ready: ${testAccount.user}`);
      }).catch(e => {
        this.logger.warn(`Ethereal upgrade failed: ${e.message}. Staying with dummy transporter.`);
      });
    }
  }

  async sendPasswordResetEmail(to: string, resetCode: string) {
    try {
      const fromEmail = process.env.SMTP_FROM || '"OpenWa CRM" <noreply@openwa.com>';
      const info = await this.transporter.sendMail({
        from: fromEmail,
        to,
        subject: 'Password Reset Code - OpenWa',
        text: `Your password reset code is: ${resetCode}\n\nThis code will expire in 15 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #1f2937; margin-bottom: 24px;">Password Reset</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">You requested a password reset for your OpenWa account.</p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Your verification code is:</p>
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #465fff;">${resetCode}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This code will expire in 15 minutes.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });

      this.logger.log(`Password reset email sent to ${to}. Message ID: ${info.messageId}`);
      
      // If using Ethereal, log the preview URL so we can actually see the email during dev!
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`[TEST EMAIL URL] View email: ${previewUrl}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
      throw error;
    }
  }
}
