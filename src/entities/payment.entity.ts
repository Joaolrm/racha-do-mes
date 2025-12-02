import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Bill } from './bill.entity';
import { BillValue } from './bill-value.entity';

@Entity('payment')
@Index(['user_id', 'bill_id', 'payed_at'])
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  @Index()
  user_id: number;

  @Column({ type: 'int', nullable: false })
  @Index()
  bill_id: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: 'ID da parcela (BillValue)',
  })
  @Index()
  bill_value_id: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: false })
  payment_value: number;

  @Column({ type: 'timestamptz', nullable: false })
  payed_at: Date;

  @Column({ type: 'bytea', nullable: true })
  receipt_photo: Buffer | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  receipt_photo_mime: string | null;

  @ManyToOne(() => User, (user) => user.payments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Bill, (bill) => bill.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @ManyToOne(() => BillValue, (billValue) => billValue.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bill_value_id' })
  billValue: BillValue;
}
