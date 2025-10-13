import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserBill } from './user-bill.entity';
import { Payment } from './payment.entity';
import { HistoryBalance } from './history-balance.entity';

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false })
  descript: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: false })
  value: number;

  @Column({ type: 'date', nullable: true })
  last_occurrence: Date;

  @Column({ type: 'date', nullable: true })
  due_date: Date;

  @Column({ type: 'int', nullable: true })
  payment_number: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => UserBill, (userBill) => userBill.bill)
  userBills: UserBill[];

  @OneToMany(() => Payment, (payment) => payment.bill)
  payments: Payment[];

  @OneToMany(() => HistoryBalance, (history) => history.bill)
  historyBalances: HistoryBalance[];
}
