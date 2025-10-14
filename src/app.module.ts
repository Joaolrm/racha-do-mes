import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entities
import { User } from './entities/user.entity';
import { Bill } from './entities/bill.entity';
import { UserBill } from './entities/user-bill.entity';
import { Payment } from './entities/payment.entity';
import { ActualBalance } from './entities/actual-balance.entity';
import { HistoryBalance } from './entities/history-balance.entity';
import { BillValue } from './entities/bill-value.entity';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BillsModule } from './bills/bills.module';
import { PaymentsModule } from './payments/payments.module';
import { BalanceModule } from './balance/balance.module';

// Guards
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        User,
        Bill,
        UserBill,
        Payment,
        ActualBalance,
        HistoryBalance,
        BillValue,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UsersModule,
    BillsModule,
    PaymentsModule,
    BalanceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
