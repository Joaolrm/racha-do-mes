import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('actual_balance')
export class ActualBalance {
  @PrimaryColumn()
  debtor_user_id: number;

  @PrimaryColumn()
  borrower_user_id: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: false })
  value: number;

  @ManyToOne(() => User, (user) => user.debts)
  @JoinColumn({ name: 'debtor_user_id' })
  debtorUser: User;

  @ManyToOne(() => User, (user) => user.credits)
  @JoinColumn({ name: 'borrower_user_id' })
  borrowerUser: User;
}
