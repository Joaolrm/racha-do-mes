import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Pagamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar novo pagamento',
    description:
      'Registra um pagamento e atualiza automaticamente os saldos entre os participantes',
  })
  @ApiResponse({ status: 201, description: 'Pagamento registrado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Usuário não participa da conta',
  })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  create(@CurrentUser() user: any, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(user.userId, createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os pagamentos' })
  @ApiResponse({ status: 200, description: 'Lista de pagamentos' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filtrar pagamentos por usuário',
  })
  @ApiQuery({
    name: 'billId',
    required: false,
    description: 'Filtrar pagamentos por conta',
  })
  findAll(
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
    @Query('billId', new ParseIntPipe({ optional: true })) billId?: number,
  ) {
    if (userId) {
      return this.paymentsService.findByUser(userId);
    }
    if (billId) {
      return this.paymentsService.findByBill(billId);
    }
    return this.paymentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pagamento por ID' })
  @ApiResponse({ status: 200, description: 'Pagamento encontrado' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover pagamento',
    description:
      'ATENÇÃO: Remover um pagamento não reverte automaticamente os saldos',
  })
  @ApiResponse({ status: 200, description: 'Pagamento removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}
