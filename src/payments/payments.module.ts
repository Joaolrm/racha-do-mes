import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from '../entities/payment.entity';
import { Bill } from '../entities/bill.entity';
import { User } from '../entities/user.entity';
import { UserBill } from '../entities/user-bill.entity';
import { ActualBalance } from '../entities/actual-balance.entity';
import { HistoryBalance } from '../entities/history-balance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Bill,
      User,
      UserBill,
      ActualBalance,
      HistoryBalance,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
