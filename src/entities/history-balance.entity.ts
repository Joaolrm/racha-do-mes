import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Bill } from './bill.entity';

@Entity('history_balance')
@Index(['debtor_user_id', 'borrower_user_id', 'created_at'])
export class HistoryBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  debtor_user_id: number;

  @Column({ type: 'int', nullable: false })
  borrower_user_id: number;

  @Column({ type: 'int', nullable: true })
  @Index()
  bill_id: number;

  @Column({ type: 'text', nullable: false })
  descript: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: false })
  value: number;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_paid: boolean;

  @ManyToOne(() => User, (user) => user.debtHistory)
  @JoinColumn({ name: 'debtor_user_id' })
  debtorUser: User;

  @ManyToOne(() => User, (user) => user.creditHistory)
  @JoinColumn({ name: 'borrower_user_id' })
  borrowerUser: User;

  @ManyToOne(() => Bill, (bill) => bill.historyBalances, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;
}
