import { Injectable } from '@nestjs/common';
import { OtpProvider } from './otp-provider.interface';
import { MessageService } from '../../message/message.service';

@Injectable()
export class WhatsappOtpProvider implements OtpProvider {
  constructor(private readonly messageService: MessageService) {}

  async sendOtp(to: string, text: string, senderConfig: any): Promise<{ success: boolean; messageId: string }> {
    const sessionId = senderConfig.sessionId;
    if (!sessionId) {
      throw new Error('WhatsappOtpProvider requires a sessionId in senderConfig');
    }

    const chatId = to.includes('@') ? to : `${to}@c.us`;

    const result = await this.messageService.sendText(sessionId, {
      chatId,
      text
    });

    return {
      success: true,
      messageId: result.messageId
    };
  }
}
