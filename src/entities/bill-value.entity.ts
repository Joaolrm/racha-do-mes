import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Bill } from './bill.entity';

@Entity('bill_values')
export class BillValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  bill_id: number;

  @Column({ type: 'int', nullable: false, comment: 'Mês (1-12)' })
  month: number;

  @Column({ type: 'int', nullable: false, comment: 'Ano (ex: 2025)' })
  year: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: false,
    default: 0,
  })
  value: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Número da parcela (se for conta parcelada)',
  })
  installment_number: number;

  @Column({ type: 'date', nullable: false, comment: 'Data de vencimento' })
  due_date: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Bill, (bill) => bill.billValues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;
}
