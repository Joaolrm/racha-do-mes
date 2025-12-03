import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ActualBalance } from '../entities/actual-balance.entity';
import { HistoryBalance } from '../entities/history-balance.entity';
import { User } from '../entities/user.entity';
import {
  BalanceResponseDto,
  UserBalanceSummaryDto,
} from './dto/balance-response.dto';
import { HistoryResponseDto } from './dto/history-response.dto';
import { DebtSummaryDto, CreditSummaryDto } from './dto/debt-summary.dto';
import { DebtDetailDto, DebtDetailItemDto } from './dto/debt-detail.dto';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(ActualBalance)
    private balanceRepository: Repository<ActualBalance>,
    @InjectRepository(HistoryBalance)
    private historyRepository: Repository<HistoryBalance>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async getUserBalance(userId: number): Promise<UserBalanceSummaryDto> {
    // Verificar se o usuário existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Buscar dívidas (onde o usuário é devedor)
    const debts = await this.balanceRepository.find({
      where: { debtor_user_id: userId },
      relations: ['debtorUser', 'borrowerUser'],
    });

    // Buscar créditos (onde o usuário é credor)
    const credits = await this.balanceRepository.find({
      where: { borrower_user_id: userId },
      relations: ['debtorUser', 'borrowerUser'],
    });

    // Calcular totais
    const total_debts = debts.reduce((sum, d) => sum + Number(d.value), 0);
    const total_credits = credits.reduce((sum, c) => sum + Number(c.value), 0);
    const net_balance = total_credits - total_debts;

    // Mapear para DTOs
    const debtsDto: BalanceResponseDto[] = debts.map((d) => ({
      debtor_user_id: d.debtor_user_id,
      debtor_name: d.debtorUser.name,
      borrower_user_id: d.borrower_user_id,
      borrower_name: d.borrowerUser.name,
      value: Number(d.value),
    }));

    const creditsDto: BalanceResponseDto[] = credits.map((c) => ({
      debtor_user_id: c.debtor_user_id,
      debtor_name: c.debtorUser.name,
      borrower_user_id: c.borrower_user_id,
      borrower_name: c.borrowerUser.name,
      value: Number(c.value),
    }));

    return {
      total_debts,
      total_credits,
      net_balance,
      debts: debtsDto,
      credits: creditsDto,
    };
  }

  async getAllBalances(): Promise<BalanceResponseDto[]> {
    const balances = await this.balanceRepository.find({
      relations: ['debtorUser', 'borrowerUser'],
    });

    return balances.map((b) => ({
      debtor_user_id: b.debtor_user_id,
      debtor_name: b.debtorUser.name,
      borrower_user_id: b.borrower_user_id,
      borrower_name: b.borrowerUser.name,
      value: Number(b.value),
    }));
  }

  async getHistory(userId?: number): Promise<HistoryResponseDto[]> {
    let query = this.historyRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.debtorUser', 'debtorUser')
      .leftJoinAndSelect('history.borrowerUser', 'borrowerUser')
      .orderBy('history.created_at', 'DESC');

    if (userId) {
      query = query.where(
        '(history.debtor_user_id = :userId OR history.borrower_user_id = :userId)',
        { userId },
      );
    }

    const history = await query.getMany();

    return history.map((h) => ({
      id: h.id,
      debtor_user_id: h.debtor_user_id,
      debtor_name: h.debtorUser.name,
      borrower_user_id: h.borrower_user_id,
      borrower_name: h.borrowerUser.name,
      bill_id: h.bill_id,
      descript: h.descript,
      value: Number(h.value),
      created_at: h.created_at,
    }));
  }

  async generateChargeMessage(userId: number): Promise<string> {
    const balance = await this.getUserBalance(userId);

    if (balance.debts.length === 0) {
      return 'Você não possui dívidas pendentes! 🎉';
    }

    let message = '💰 *Resumo de Contas - Racha do Mês*\n\n';
    message += `Olá! Aqui está um resumo das suas contas:\n\n`;

    for (const debt of balance.debts) {
      message += `• Você deve *R$ ${debt.value.toFixed(2)}* para ${debt.borrower_name}\n`;
    }

    message += `\n📊 *Total a pagar: R$ ${balance.total_debts.toFixed(2)}*\n\n`;
    message +=
      'Por favor, realize o pagamento o mais breve possível. Obrigado! 😊';

    return message;
  }

  /**
   * Lista todas as pessoas que o usuário deve (onde o usuário é devedor)
   */
  async getMyDebts(userId: number): Promise<DebtSummaryDto[]> {
    // Verificar se o usuário existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Buscar dívidas (onde o usuário é devedor)
    const debts = await this.balanceRepository.find({
      where: { debtor_user_id: userId },
      relations: ['borrowerUser'],
    });

    return debts.map((debt) => ({
      user_id: debt.borrower_user_id,
      user_name: debt.borrowerUser.name,
      total_value: Number(debt.value),
    }));
  }

  /**
   * Detalha a dívida do usuário com uma pessoa específica (onde o usuário é devedor)
   */
  async getMyDebtDetail(
    userId: number,
    creditorId: number,
  ): Promise<DebtDetailDto> {
    // Verificar se o usuário existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Verificar se o credor existe
    const creditor = await this.userRepository.findOne({
      where: { id: creditorId },
    });
    if (!creditor) {
      throw new NotFoundException(
        `Usuário credor com ID ${creditorId} não encontrado`,
      );
    }

    // Buscar saldo atual
    const balance = await this.balanceRepository.findOne({
      where: {
        debtor_user_id: userId,
        borrower_user_id: creditorId,
      },
      relations: ['borrowerUser'],
    });

    if (!balance) {
      throw new NotFoundException(
        'Não existe dívida entre você e este usuário',
      );
    }

    // Buscar histórico detalhado - apenas itens não pagos, ordenado do mais recente para o mais antigo
    const unpaidHistory = await this.historyRepository.find({
      where: {
        debtor_user_id: userId,
        borrower_user_id: creditorId,
        is_paid: false,
      },
      order: { created_at: 'DESC' },
    });

    const currentBalanceValue = Number(balance.value);

    const historyItems: DebtDetailItemDto[] = unpaidHistory.map((h) => ({
      id: h.id,
      bill_id: h.bill_id,
      descript: h.descript,
      value: Number(h.value),
      created_at: h.created_at,
    }));

    return {
      user_id: creditorId,
      user_name: creditor.name,
      total_value: currentBalanceValue,
      history: historyItems,
    };
  }

  /**
   * Lista todas as pessoas que devem ao usuário (onde o usuário é credor)
   */
  async getMyCredits(userId: number): Promise<CreditSummaryDto[]> {
    // Verificar se o usuário existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Buscar créditos (onde o usuário é credor)
    const credits = await this.balanceRepository.find({
      where: { borrower_user_id: userId },
      relations: ['debtorUser'],
    });

    return credits.map((credit) => ({
      user_id: credit.debtor_user_id,
      user_name: credit.debtorUser.name,
      total_value: Number(credit.value),
    }));
  }

  /**
   * Detalha o que uma pessoa específica deve ao usuário (onde o usuário é credor)
   */
  async getMyCreditDetail(
    userId: number,
    debtorId: number,
  ): Promise<DebtDetailDto> {
    // Verificar se o usuário existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Verificar se o devedor existe
    const debtor = await this.userRepository.findOne({
      where: { id: debtorId },
    });
    if (!debtor) {
      throw new NotFoundException(
        `Usuário devedor com ID ${debtorId} não encontrado`,
      );
    }

    // Buscar saldo atual
    const balance = await this.balanceRepository.findOne({
      where: {
        debtor_user_id: debtorId,
        borrower_user_id: userId,
      },
      relations: ['debtorUser'],
    });

    if (!balance) {
      throw new NotFoundException(
        'Não existe dívida entre você e este usuário',
      );
    }

    // Buscar histórico detalhado - apenas itens não pagos, ordenado do mais recente para o mais antigo
    const unpaidHistory = await this.historyRepository.find({
      where: {
        debtor_user_id: debtorId,
        borrower_user_id: userId,
        is_paid: false,
      },
      order: { created_at: 'DESC' },
    });

    const currentBalanceValue = Number(balance.value);

    const historyItems: DebtDetailItemDto[] = unpaidHistory.map((h) => ({
      id: h.id,
      bill_id: h.bill_id,
      descript: h.descript,
      value: Number(h.value),
      created_at: h.created_at,
    }));

    return {
      user_id: debtorId,
      user_name: debtor.name,
      total_value: currentBalanceValue,
      history: historyItems,
    };
  }

  /**
   * Confirma pagamento de uma dívida (onde o usuário é credor)
   * Cria um movimento negativo no histórico e desconta do saldo atual
   */
  async confirmPayment(
    userId: number,
    debtorId: number,
    paymentValue?: number,
  ): Promise<{ message: string }> {
    // Verificar se o usuário existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Verificar se o devedor existe
    const debtor = await this.userRepository.findOne({
      where: { id: debtorId },
    });
    if (!debtor) {
      throw new NotFoundException(
        `Usuário devedor com ID ${debtorId} não encontrado`,
      );
    }

    // Buscar saldo atual
    const balance = await this.balanceRepository.findOne({
      where: {
        debtor_user_id: debtorId,
        borrower_user_id: userId,
      },
    });

    if (!balance) {
      throw new NotFoundException(
        'Não existe dívida entre você e este usuário',
      );
    }

    const currentBalanceValue = Number(balance.value);
    if (currentBalanceValue <= 0) {
      throw new BadRequestException('Não há valor pendente para confirmar');
    }

    // Se não informou valor, confirma o total
    const valueToConfirm = paymentValue || currentBalanceValue;
    if (valueToConfirm <= 0) {
      throw new BadRequestException(
        'Valor do pagamento deve ser maior que zero',
      );
    }

    // Buscar itens pendentes do histórico para marcar como pagos (mais antigo primeiro)
    const unpaidHistoryItems = await this.historyRepository.find({
      where: {
        debtor_user_id: debtorId,
        borrower_user_id: userId,
        is_paid: false,
      },
      order: { created_at: 'ASC' }, // Mais antigo primeiro
    });

    // Usar transação para garantir consistência
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let remainingToPay = valueToConfirm;

      // Pagar do mais antigo para o mais recente
      for (const historyItem of unpaidHistoryItems) {
        if (remainingToPay <= 0) break;

        const itemValue = Number(historyItem.value);
        if (itemValue <= remainingToPay) {
          // Marcar o item inteiro como pago
          historyItem.is_paid = true;
          remainingToPay -= itemValue;
          await queryRunner.manager.save(historyItem);
        } else {
          // Item é maior que o restante - pagar parcialmente
          // Ajustar o valor do item original (deixar o resto pendente)
          const remainingValue = itemValue - remainingToPay;
          historyItem.value = remainingValue;
          await queryRunner.manager.save(historyItem);

          remainingToPay = 0;
          break;
        }
      }

      // Calcular novo saldo (valor devido menos o que foi efetivamente pago)
      const actuallyPaid = valueToConfirm - remainingToPay;
      const newBalanceValue = currentBalanceValue - actuallyPaid;

      // Atualizar ou remover o balance atual
      if (newBalanceValue <= 0) {
        // Remover o registro de dívida atual
        await queryRunner.manager.remove(balance);
      } else {
        // Ainda há dívida pendente - atualizar o balance
        balance.value = newBalanceValue;
        await queryRunner.manager.save(balance);
      }

      // Se pagou mais que devia (ainda sobra valor), criar nova dívida invertida
      if (remainingToPay > 0) {
        const excessValue = remainingToPay;

        // Verificar se já existe dívida invertida
        const invertedBalance = await queryRunner.manager.findOne(
          ActualBalance,
          {
            where: {
              debtor_user_id: userId, // Agora o credor original é o devedor
              borrower_user_id: debtorId, // E o devedor original é o credor
            },
          },
        );

        if (invertedBalance) {
          // Atualizar dívida invertida existente
          invertedBalance.value = Number(invertedBalance.value) + excessValue;
          await queryRunner.manager.save(invertedBalance);
        } else {
          // Criar nova dívida invertida
          const newInvertedBalance = queryRunner.manager.create(ActualBalance, {
            debtor_user_id: userId,
            borrower_user_id: debtorId,
            value: excessValue,
          });
          await queryRunner.manager.save(newInvertedBalance);
        }

        // Criar item no histórico para o excesso pago
        const excessHistory = queryRunner.manager.create(HistoryBalance, {
          debtor_user_id: userId,
          borrower_user_id: debtorId,
          bill_id: null,
          descript: `Excesso de pagamento - ${debtor.name}`,
          value: excessValue,
          is_paid: false,
        });
        await queryRunner.manager.save(excessHistory);
      }

      await queryRunner.commitTransaction();

      let message = '';
      if (remainingToPay > 0) {
        message = `🔄 Dívida invertida! Pagamento de ${valueToConfirm.toFixed(2)} confirmado. `;
        message += `O excesso de ${remainingToPay.toFixed(2)} foi considerado crédito e agora ${debtor.name} te deve esse valor.`;
      } else if (newBalanceValue <= 0) {
        message = `✅ Pagamento de ${valueToConfirm.toFixed(2)} confirmado. Dívida totalmente quitada!`;
      } else {
        message = `✅ Pagamento de ${valueToConfirm.toFixed(2)} confirmado. Restam ${newBalanceValue.toFixed(2)} pendentes.`;
      }

      return { message };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
