import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserBill } from './user-bill.entity';
import { Payment } from './payment.entity';
import { ActualBalance } from './actual-balance.entity';
import { HistoryBalance } from './history-balance.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone_number: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => UserBill, (userBill) => userBill.user)
  userBills: UserBill[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(() => ActualBalance, (balance) => balance.debtorUser)
  debts: ActualBalance[];

  @OneToMany(() => ActualBalance, (balance) => balance.borrowerUser)
  credits: ActualBalance[];

  @OneToMany(() => HistoryBalance, (history) => history.debtorUser)
  debtHistory: HistoryBalance[];

  @OneToMany(() => HistoryBalance, (history) => history.borrowerUser)
  creditHistory: HistoryBalance[];
}
