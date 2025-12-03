import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BalanceService } from './balance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserBalanceSummaryDto } from './dto/balance-response.dto';
import { HistoryResponseDto } from './dto/history-response.dto';
import { DebtSummaryDto, CreditSummaryDto } from './dto/debt-summary.dto';
import { DebtDetailDto } from './dto/debt-detail.dto';
import { UserFromJwt } from '../auth/jwt.strategy';

@ApiTags('Saldos e Histórico')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Obter saldo do usuário autenticado',
    description:
      'Retorna resumo completo de dívidas e créditos do usuário logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Saldo do usuário',
    type: UserBalanceSummaryDto,
  })
  getMyBalance(@CurrentUser() user: UserFromJwt) {
    return this.balanceService.getUserBalance(user.userId);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Obter saldo de um usuário específico',
    description: 'Retorna resumo completo de dívidas e créditos de um usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Saldo do usuário',
    type: UserBalanceSummaryDto,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  getUserBalance(@Param('userId', ParseIntPipe) userId: number) {
    return this.balanceService.getUserBalance(userId);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Obter todos os saldos',
    description: 'Lista todas as relações de débito/crédito entre usuários',
  })
  @ApiResponse({ status: 200, description: 'Lista de saldos' })
  getAllBalances() {
    return this.balanceService.getAllBalances();
  }

  @Get('history')
  @ApiOperation({
    summary: 'Obter histórico de transações',
    description: 'Lista histórico de todas as transações que geraram saldos',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico de transações',
    type: [HistoryResponseDto],
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filtrar histórico por usuário',
  })
  getHistory(
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
  ) {
    return this.balanceService.getHistory(userId);
  }

  @Get('charge-message/me')
  @ApiOperation({
    summary: 'Gerar mensagem de cobrança para o usuário autenticado',
    description:
      'Gera uma mensagem formatada para WhatsApp/Email com as dívidas pendentes',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensagem de cobrança gerada',
    schema: {
      example: {
        message:
          '💰 *Resumo de Contas - Racha do Mês*\n\nOlá! Aqui está um resumo das suas contas:\n\n• Você deve *R$ 750.00* para Maria Santos\n\n📊 *Total a pagar: R$ 750.00*\n\nPor favor, realize o pagamento o mais breve possível. Obrigado! 😊',
      },
    },
  })
  getMyChargeMessage(@CurrentUser() user: UserFromJwt) {
    return this.balanceService
      .generateChargeMessage(user.userId)
      .then((message) => ({ message }));
  }

  @Get('charge-message/:userId')
  @ApiOperation({
    summary: 'Gerar mensagem de cobrança para um usuário',
    description:
      'Gera uma mensagem formatada para WhatsApp/Email com as dívidas pendentes de um usuário específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensagem de cobrança gerada',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  getChargeMessage(@Param('userId', ParseIntPipe) userId: number) {
    return this.balanceService
      .generateChargeMessage(userId)
      .then((message) => ({ message }));
  }

  @Get('me/debts')
  @ApiOperation({
    summary: 'Listar pessoas que eu devo',
    description:
      'Retorna lista de pessoas para quem o usuário autenticado deve dinheiro, com o valor total de cada dívida',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pessoas que você deve',
    type: [DebtSummaryDto],
  })
  getMyDebts(@CurrentUser() user: UserFromJwt): Promise<DebtSummaryDto[]> {
    return this.balanceService.getMyDebts(user.userId);
  }

  @Get('me/debts/:creditorId')
  @ApiOperation({
    summary: 'Detalhar dívida com uma pessoa específica',
    description:
      'Retorna detalhamento completo da dívida do usuário autenticado com uma pessoa específica, incluindo histórico de transações',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhamento da dívida',
    type: DebtDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado ou dívida não existe',
  })
  getMyDebtDetail(
    @CurrentUser() user: UserFromJwt,
    @Param('creditorId', ParseIntPipe) creditorId: number,
  ): Promise<DebtDetailDto> {
    return this.balanceService.getMyDebtDetail(user.userId, creditorId);
  }

  @Get('me/credits')
  @ApiOperation({
    summary: 'Listar pessoas que me devem',
    description:
      'Retorna lista de pessoas que devem dinheiro ao usuário autenticado, com o valor total de cada crédito',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pessoas que te devem',
    type: [CreditSummaryDto],
  })
  getMyCredits(@CurrentUser() user: UserFromJwt): Promise<CreditSummaryDto[]> {
    return this.balanceService.getMyCredits(user.userId);
  }

  @Get('me/credits/:debtorId')
  @ApiOperation({
    summary: 'Detalhar o que uma pessoa me deve',
    description:
      'Retorna detalhamento completo do que uma pessoa específica deve ao usuário autenticado, incluindo histórico de transações',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhamento do crédito',
    type: DebtDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado ou dívida não existe',
  })
  getMyCreditDetail(
    @CurrentUser() user: UserFromJwt,
    @Param('debtorId', ParseIntPipe) debtorId: number,
  ): Promise<DebtDetailDto> {
    return this.balanceService.getMyCreditDetail(user.userId, debtorId);
  }
}
