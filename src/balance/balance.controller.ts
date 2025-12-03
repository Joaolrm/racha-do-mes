import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BalanceService } from './balance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DebtSummaryDto, CreditSummaryDto } from './dto/debt-summary.dto';
import { DebtDetailDto } from './dto/debt-detail.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { UserFromJwt } from '../auth/jwt.strategy';

@ApiTags('Saldos e Histórico')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

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

  @Post('me/credits/:debtorId/confirm-payment')
  @ApiOperation({
    summary: 'Confirmar pagamento de uma dívida',
    description:
      'Marca que uma dívida foi paga. Cria um movimento negativo no histórico e desconta do saldo atual. Se não informar o valor, confirma o total devido.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pagamento confirmado com sucesso',
    schema: {
      example: {
        message: 'Pagamento de 100.00 confirmado com sucesso',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado ou dívida não existe',
  })
  @ApiResponse({
    status: 400,
    description: 'Valor inválido ou não há valor pendente',
  })
  confirmPayment(
    @CurrentUser() user: UserFromJwt,
    @Param('debtorId', ParseIntPipe) debtorId: number,
    @Body() confirmPaymentDto: ConfirmPaymentDto,
  ): Promise<{ message: string }> {
    return this.balanceService.confirmPayment(
      user.userId,
      debtorId,
      confirmPaymentDto.payment_value,
    );
  }
}
