import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { User } from './entities/user.entity';
import { CrmContact } from './entities/crm-contact.entity';
import { CrmTemplate } from './entities/crm-template.entity';
import { CrmTag } from './entities/crm-tag.entity';
import { CrmSegment } from './entities/crm-segment.entity';
import { CrmMedia } from './entities/crm-media.entity';
import { CrmFlow } from './entities/crm-flow.entity';
import { CrmFlowState } from './entities/crm-flow-state.entity';
import { CrmCustomField } from './entities/crm-custom-field.entity';
import { Session } from '../session/entities/session.entity';
import { Message } from '../message/entities/message.entity';

import { CrmAuthService } from './services/crm-auth.service';
import { CrmContactsService } from './services/crm-contacts.service';
import { CrmTemplatesService } from './services/crm-templates.service';
import { CrmTagsService } from './services/crm-tags.service';
import { CrmSegmentsService } from './services/crm-segments.service';
import { CrmMediaService } from './services/crm-media.service';
import { CrmFlowsService } from './services/crm-flows.service';
import { CrmCustomFieldsService } from './services/crm-custom-fields.service';
import { CrmDashboardService } from './services/crm-dashboard.service';
import { FlowRunnerService } from './services/flow-runner.service';
import { CrmEventsGateway } from './gateways/crm-events.gateway';
import { MailService } from './services/mail.service';

import { CrmAuthController } from './controllers/crm-auth.controller';
import { CrmContactsController } from './controllers/crm-contacts.controller';
import { CrmTemplatesController } from './controllers/crm-templates.controller';
import { CrmTagsController } from './controllers/crm-tags.controller';
import { CrmSegmentsController } from './controllers/crm-segments.controller';
import { CrmMediaController } from './controllers/crm-media.controller';
import { CrmSessionsController } from './controllers/crm-sessions.controller';
import { CrmFlowsController } from './controllers/crm-flows.controller';
import { CrmCustomFieldsController } from './controllers/crm-custom-fields.controller';
import { CrmDashboardController } from './controllers/crm-dashboard.controller';
import { CrmAuditController } from './controllers/crm-audit.controller';
import { CrmMonitorController } from './controllers/crm-monitor.controller';

import { JwtStrategy } from './strategies/jwt.strategy';
import { SessionModule } from '../session/session.module';
import { MessageModule } from '../message/message.module';
import { AuditModule } from '../audit/audit.module';
import { MonitorService } from '../monitor/monitor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CrmContact, CrmTemplate, CrmTag, CrmSegment, CrmMedia, CrmFlow, CrmFlowState, CrmCustomField, Session, Message], 'data'),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret_for_crm_openwa',
      signOptions: { expiresIn: '7d' },
    }),
    SessionModule,
    forwardRef(() => MessageModule),
    AuditModule,
  ],
  controllers: [
    CrmAuthController,
    CrmContactsController,
    CrmTemplatesController,
    CrmTagsController,
    CrmSegmentsController,
    CrmMediaController,
    CrmSessionsController,
    CrmFlowsController,
    CrmCustomFieldsController,
    CrmDashboardController,
    CrmAuditController,
    CrmMonitorController,
  ],
  providers: [
    CrmAuthService,
    CrmContactsService,
    CrmTemplatesService,
    CrmTagsService,
    CrmSegmentsService,
    CrmMediaService,
    CrmFlowsService,
    CrmCustomFieldsService,
    CrmDashboardService,
    FlowRunnerService,
    JwtStrategy,
    CrmEventsGateway,
    MailService,
    MonitorService,
  ],
  exports: [CrmAuthService, CrmMediaService, CrmFlowsService, FlowRunnerService, CrmEventsGateway, MailService],
})
export class CrmModule {
  constructor(private readonly flowRunnerService: FlowRunnerService) {}
}

