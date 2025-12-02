import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { Bill } from '../entities/bill.entity';
import { UserBill } from '../entities/user-bill.entity';
import { User } from '../entities/user.entity';
import { BillValue } from '../entities/bill-value.entity';
import { Payment } from '../entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bill, UserBill, User, BillValue, Payment]),
  ],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
