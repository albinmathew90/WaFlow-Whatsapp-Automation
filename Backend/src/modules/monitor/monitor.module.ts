import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitorController } from './monitor.controller';
import { MonitorService } from './monitor.service';
import { SystemAlert } from './entities/system-alert.entity';
import { MessageStatusLog } from '../message/entities/message-status-log.entity';
import { Message } from '../message/entities/message.entity';
import { MessageBatch } from '../message/entities/message-batch.entity';
import { CrmContact } from '../crm/entities/crm-contact.entity';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemAlert, MessageStatusLog, Message, MessageBatch, CrmContact], 'data'),
    MessageModule,
  ],
  controllers: [MonitorController],
  providers: [MonitorService],
  exports: [MonitorService],
})
export class MonitorModule {}
