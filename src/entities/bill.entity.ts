import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserBill } from './user-bill.entity';
import { Payment } from './payment.entity';
import { HistoryBalance } from './history-balance.entity';
import { BillValue } from './bill-value.entity';
import { User } from './user.entity';

export enum BillType {
  RECORRENTE = 'recorrente',
  PARCELADA = 'parcelada',
}

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false })
  descript: string;

  @Column({
    type: 'enum',
    enum: BillType,
    default: BillType.RECORRENTE,
    nullable: false,
  })
  type: BillType;

  @Column({ type: 'int', nullable: false, comment: 'ID do dono da conta' })
  owner_id: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: 'Dia do mês de vencimento (1-31)',
  })
  due_day: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    comment: 'Valor total (apenas para contas parceladas)',
  })
  total_value: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Número de parcelas (apenas para contas parceladas)',
  })
  installments: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Mês de início (1-12, apenas para contas parceladas)',
  })
  start_month: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Ano de início (apenas para contas parceladas)',
  })
  start_year: number;

  @Column({ type: 'date', nullable: true })
  last_occurrence: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => UserBill, (userBill) => userBill.bill, { cascade: true })
  userBills: UserBill[];

  @OneToMany(() => Payment, (payment) => payment.bill)
  payments: Payment[];

  @OneToMany(() => HistoryBalance, (history) => history.bill)
  historyBalances: HistoryBalance[];

  @OneToMany(() => BillValue, (billValue) => billValue.bill, { cascade: true })
  billValues: BillValue[];
}
