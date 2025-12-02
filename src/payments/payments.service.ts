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
import { UpdatePaymentDto } from './dto/update-payment.dto';

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
    receiptPhoto?: { buffer: Buffer; mimetype: string },
  ): Promise<Payment> {
    const { bill_value_id, payment_value, payed_at } = createPaymentDto;

    // Buscar o BillValue (parcela) correspondente
    const billValue = await this.billValueRepository.findOne({
      where: { id: bill_value_id },
      relations: ['bill'],
    });

    if (!billValue) {
      throw new NotFoundException(
        `Parcela com ID ${bill_value_id} não encontrada`,
      );
    }

    const bill_id = billValue.bill_id;

    // Verificar se a conta existe
    const bill = await this.billRepository.findOne({
      where: { id: bill_id },
      relations: ['userBills'],
    });

    if (!bill) {
      throw new NotFoundException(`Conta com ID ${bill_id} não encontrada`);
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
        bill_value_id,
        payment_value,
        payed_at: new Date(payed_at),
        receipt_photo: receiptPhoto?.buffer || null,
        receipt_photo_mime: receiptPhoto?.mimetype || null,
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
                  `Pagamento de ${bill.descript} (${billValue.month}/${billValue.year})`,
                );
              }
            }
          }
        }
      }

      // Verificar se o usuário pagou o valor total devido e marcar como pago
      await this.checkAndMarkAsPaid(queryRunner, userId, bill_id, billValue.id);

      await queryRunner.commitTransaction();
      return savedPayment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async checkAndMarkAsPaid(
    queryRunner: QueryRunner,
    userId: number,
    billId: number,
    billValueId: number,
  ): Promise<void> {
    // Buscar o valor da conta (parcela)
    const billValue = await queryRunner.manager.findOne(BillValue, {
      where: { id: billValueId },
    });

    if (!billValue) {
      return;
    }

    // Buscar TODOS os pagamentos para esta parcela (de todos os usuários)
    const payments = await queryRunner.manager.find(Payment, {
      where: {
        bill_id: billId,
        bill_value_id: billValueId,
      },
    });

    // Somar o total pago por todos os usuários
    const totalPaid = payments.reduce(
      (sum, p) => sum + Number(p.payment_value),
      0,
    );

    // Se o total pago for >= ao valor total da conta, marcar como paga
    // Se value = 0, só é pago se houver pagamento explícito
    if (billValue.value === 0) {
      billValue.is_paid = totalPaid > 0;
    } else {
      billValue.is_paid = totalPaid >= Number(billValue.value);
    }

    await queryRunner.manager.save(billValue);
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

  async update(
    id: number,
    userId: number,
    updatePaymentDto: UpdatePaymentDto,
    newReceiptPhoto?: { buffer: Buffer; mimetype: string },
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user', 'bill'],
    });

    if (!payment) {
      throw new NotFoundException(`Pagamento com ID ${id} não encontrado`);
    }

    // Verificar se o usuário é o dono do pagamento
    if (payment.user_id !== userId) {
      throw new BadRequestException(
        'Você não pode editar pagamentos de outros usuários',
      );
    }

    // Atualizar valor e data (campos obrigatórios no PUT)
    payment.payment_value = updatePaymentDto.payment_value;
    payment.payed_at = new Date(updatePaymentDto.payed_at);

    // Atualizar ou remover foto
    if (updatePaymentDto.remove_receipt === true) {
      // Remover foto existente
      payment.receipt_photo = null;
      payment.receipt_photo_mime = null;
    } else if (newReceiptPhoto) {
      // Adicionar nova foto
      payment.receipt_photo = newReceiptPhoto.buffer;
      payment.receipt_photo_mime = newReceiptPhoto.mimetype;
    }

    return await this.paymentRepository.save(payment);
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
  }
}
