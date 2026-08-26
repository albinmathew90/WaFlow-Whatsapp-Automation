import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { User } from '../crm/entities/user.entity';
import { AdminSettings } from '../admin/entities/admin-settings.entity';
import { PaymentHistory } from '../crm/entities/payment-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PaymentHistory, AdminSettings], 'data'), // Assuming 'data' connection
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
