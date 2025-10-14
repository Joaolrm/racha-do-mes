import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { Bill } from '../entities/bill.entity';
import { User } from '../entities/user.entity';
import { UserBill } from '../entities/user-bill.entity';
import { ActualBalance } from '../entities/actual-balance.entity';
import { HistoryBalance } from '../entities/history-balance.entity';
import { BillValue } from '../entities/bill-value.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserBill)
    private userBillRepository: Repository<UserBill>,
    @InjectRepository(ActualBalance)
    private balanceRepository: Repository<ActualBalance>,
    @InjectRepository(HistoryBalance)
    private historyRepository: Repository<HistoryBalance>,
    @InjectRepository(BillValue)
    private billValueRepository: Repository<BillValue>,
    private dataSource: DataSource,
  ) {}

  async create(
    userId: number,
    createPaymentDto: CreatePaymentDto,
  ): Promise<Payment> {
    const { bill_id, month, year, payment_value, payed_at } = createPaymentDto;

    // Verificar se a conta existe
    const bill = await this.billRepository.findOne({
      where: { id: bill_id },
      relations: ['userBills'],
    });

    if (!bill) {
      throw new NotFoundException(`Conta com ID ${bill_id} não encontrada`);
    }

    // Buscar o valor mensal correspondente
    const billValue = await this.billValueRepository.findOne({
      where: { bill_id, month, year },
    });

    if (!billValue) {
      throw new NotFoundException(
        `Valor não encontrado para a conta no mês ${month}/${year}`,
      );
    }

    // Verificar se o usuário existe
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Verificar se o usuário participa da conta
    const userBill = bill.userBills.find((ub) => ub.user_id === userId);
    if (!userBill) {
      throw new BadRequestException('Usuário não participa desta conta');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Criar o pagamento
      const payment = this.paymentRepository.create({
        user_id: userId,
        bill_id,
        payment_value,
        payed_at: new Date(payed_at),
      });
      const savedPayment = await queryRunner.manager.save(payment);

      // Atualizar last_occurrence da conta
      bill.last_occurrence = new Date(payed_at);
      await queryRunner.manager.save(bill);

      // Calcular quanto cada participante deve
      const billValueAmount = Number(billValue.value);
      const valuePerUser = billValueAmount / 100; // valor base para 1%

      for (const participant of bill.userBills) {
        const participantShare = valuePerUser * participant.share_percentage;

        if (participant.user_id === userId) {
          // Se o pagador é este participante
          const amountPaidForOthers = payment_value - participantShare;

          if (amountPaidForOthers > 0) {
            // Distribuir o crédito entre os outros participantes
            for (const otherParticipant of bill.userBills) {
              if (otherParticipant.user_id !== userId) {
                const otherShare =
                  valuePerUser * otherParticipant.share_percentage;
                const proportionalCredit =
                  (otherShare / (billValueAmount - participantShare)) *
                  amountPaidForOthers;

                await this.updateBalance(
                  queryRunner,
                  otherParticipant.user_id,
                  userId,
                  proportionalCredit,
                  bill.id,
                  `Pagamento de ${bill.descript} (${month}/${year})`,
                );
              }
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return savedPayment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async updateBalance(
    queryRunner: QueryRunner,
    debtorId: number,
    creditorId: number,
    value: number,
    billId: number,
    description: string,
  ): Promise<void> {
    // Atualizar ou criar saldo atual
    let balance = await queryRunner.manager.findOne(ActualBalance, {
      where: {
        debtor_user_id: debtorId,
        borrower_user_id: creditorId,
      },
    });

    if (balance) {
      balance.value = Number(balance.value) + value;
      await queryRunner.manager.save(balance);
    } else {
      balance = queryRunner.manager.create(ActualBalance, {
        debtor_user_id: debtorId,
        borrower_user_id: creditorId,
        value,
      });
      await queryRunner.manager.save(balance);
    }

    // Criar entrada no histórico
    const history = queryRunner.manager.create(HistoryBalance, {
      debtor_user_id: debtorId,
      borrower_user_id: creditorId,
      bill_id: billId,
      descript: description,
      value,
    });
    await queryRunner.manager.save(history);
  }

  async findAll(): Promise<Payment[]> {
    return await this.paymentRepository.find({
      relations: ['user', 'bill'],
      order: { payed_at: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { user_id: userId },
      relations: ['user', 'bill'],
      order: { payed_at: 'DESC' },
    });
  }

  async findByBill(billId: number): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { bill_id: billId },
      relations: ['user', 'bill'],
      order: { payed_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user', 'bill'],
    });

    if (!payment) {
      throw new NotFoundException(`Pagamento com ID ${id} não encontrado`);
    }

    return payment;
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
  }
}
