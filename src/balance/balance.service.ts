import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActualBalance } from '../entities/actual-balance.entity';
import { HistoryBalance } from '../entities/history-balance.entity';
import { User } from '../entities/user.entity';
import {
  BalanceResponseDto,
  UserBalanceSummaryDto,
} from './dto/balance-response.dto';
import { HistoryResponseDto } from './dto/history-response.dto';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(ActualBalance)
    private balanceRepository: Repository<ActualBalance>,
    @InjectRepository(HistoryBalance)
    private historyRepository: Repository<HistoryBalance>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
}
