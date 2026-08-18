import { DataSource } from 'typeorm';
import { SystemAlert } from './src/modules/monitor/entities/system-alert.entity';
import { MessageStatusLog } from './src/modules/message/entities/message-status-log.entity';
import { CrmContact } from './src/modules/crm/entities/crm-contact.entity';
import { Message } from './src/modules/message/entities/message.entity';
import { User } from './src/modules/crm/entities/user.entity';
import { CrmSegment } from './src/modules/crm/entities/crm-segment.entity';
import { CrmTag } from './src/modules/crm/entities/crm-tag.entity';
import { MessageBatch } from './src/modules/message/entities/message-batch.entity';

const ds = new DataSource({
  type: 'sqlite',
  database: './data/openwa.sqlite',
  entities: [SystemAlert, MessageStatusLog, CrmContact, Message, User, CrmSegment, CrmTag, MessageBatch],
  synchronize: true,
});

ds.initialize()
  .then(() => {
    console.log('Synchronized data database successfully!');
    process.exit(0);
  })
  .catch((err: any) => {
    console.error('Error during synchronization', err);
    process.exit(1);
  });
