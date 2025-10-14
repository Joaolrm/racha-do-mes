import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Bill } from './bill.entity';

export enum UserBillStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

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

  @Column({
    type: 'enum',
    enum: UserBillStatus,
    default: UserBillStatus.PENDING,
    nullable: false,
  })
  status: UserBillStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  invited_at: Date;

  @ManyToOne(() => User, (user) => user.userBills)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Bill, (bill) => bill.userBills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;
}
