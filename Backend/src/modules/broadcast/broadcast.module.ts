import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { Broadcast, BroadcastRecipient, BroadcastActivityLog } from './entities/broadcast.entity';
import { CrmContact } from '../crm/entities/crm-contact.entity';
import { CrmSegment } from '../crm/entities/crm-segment.entity';
import { User } from '../crm/entities/user.entity';

import { BroadcastService } from './services/broadcast.service';
import { BroadcastQueueService } from './services/broadcast-queue.service';
import { BroadcastController } from './broadcast.controller';
import { MessageModule } from '../message/message.module';
import { InboxModule } from '../inbox/inbox.module';
import { TemplateModule } from '../template/template.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Broadcast, BroadcastRecipient, BroadcastActivityLog, CrmContact, CrmSegment, User],
      'data',
    ),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret_for_crm_openwa',
      signOptions: { expiresIn: '7d' },
    }),
    MessageModule,
    InboxModule,
    TemplateModule,
    AuditModule,
  ],
  controllers: [BroadcastController],
  providers: [BroadcastService, BroadcastQueueService],
  exports: [BroadcastService],
})
export class BroadcastModule { }
