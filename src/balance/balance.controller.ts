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
  getMyBalance(@CurrentUser() user: any) {
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
  getMyChargeMessage(@CurrentUser() user: any) {
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
}
