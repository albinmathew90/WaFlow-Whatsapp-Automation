import { Module } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpApplication } from './entities/otp-application.entity';
import { ApplicationWhatsappSession } from './entities/application-whatsapp-session.entity';
import { OtpTemplate } from './entities/otp-template.entity';
import { OtpTemplateVersion } from './entities/otp-template-version.entity';
import { OtpRequest } from './entities/otp-request.entity';
import { OtpWebhook, OtpWebhookDelivery } from './entities/otp-webhook.entity';
import { OtpApiKeyLog } from './entities/otp-api-key-log.entity';
import { OtpLog } from './entities/otp-log.entity';
import { MessageDeliveryLog } from './entities/message-delivery-log.entity';
import { OtpAnalyticsDaily } from './entities/otp-analytics-daily.entity';
import { OtpAuditLog } from './entities/otp-audit-log.entity';
import { OtpManagementController } from './controllers/otp-management.controller';
import { OtpPublicController } from './controllers/otp-public.controller';
import { OtpOpenwaController } from './controllers/otp-openwa.controller';
import { OtpAnalyticsController } from './controllers/otp-analytics.controller';
import { OtpLogsController } from './controllers/otp-logs.controller';
import { OtpManagementService } from './services/otp-management.service';
import { OtpPublicService } from './services/otp-public.service';
import { OtpWebhookService } from './services/otp-webhook.service';
import { OtpOpenwaService } from './services/otp-openwa.service';
import { OtpDeliveryProcessor } from './services/otp-delivery.processor';
import { OtpAnalyticsService } from './services/otp-analytics.service';
import { OtpAuditLogService } from './services/otp-audit-log.service';
import { OtpLogsService } from './services/otp-logs.service';
import { WhatsappOtpProvider } from './providers/whatsapp-otp.provider';
import { SessionModule } from '../session/session.module';
import { MessageModule } from '../message/message.module';
import { QUEUE_NAMES } from '../queue/queue-names';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OtpApplication,
      ApplicationWhatsappSession,
      OtpTemplate,
      OtpTemplateVersion,
      OtpRequest,
      OtpWebhook,
      OtpWebhookDelivery,
      OtpApiKeyLog,
      OtpLog,
      MessageDeliveryLog,
      OtpAnalyticsDaily,
      OtpAuditLog,
    ], 'data'),
    SessionModule,
    MessageModule,
  ],
  controllers: [
    OtpManagementController,
    OtpPublicController,
    OtpOpenwaController,
    OtpAnalyticsController,
    OtpLogsController
  ],
  providers: [
    OtpManagementService,
    OtpPublicService,
    OtpWebhookService,
    OtpOpenwaService,
    OtpDeliveryProcessor,
    OtpAnalyticsService,
    OtpAuditLogService,
    OtpLogsService,
    WhatsappOtpProvider,
    {
      provide: getQueueToken(QUEUE_NAMES.OTP),
      useFactory: (processor: OtpDeliveryProcessor) => ({
        add: async (name: string, data: any) => {
          setTimeout(() => {
            processor.process({ name, data } as any).catch(console.error);
          }, 0);
        }
      }),
      inject: [OtpDeliveryProcessor],
    }
  ],
  exports: [OtpManagementService, OtpPublicService, OtpWebhookService],
})
export class OtpModule {}
