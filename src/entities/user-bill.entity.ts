import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { Bill } from './bill.entity';

@Entity('user_bills')
export class UserBill {
  @PrimaryColumn()
  user_id: number;

  @PrimaryColumn()
  bill_id: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: false })
  share_percentage: number;

  @Column({ type: 'boolean', nullable: false, default: false })
  is_paid: boolean;

  @ManyToOne(() => User, (user) => user.userBills)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Bill, (bill) => bill.userBills)
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;
}
