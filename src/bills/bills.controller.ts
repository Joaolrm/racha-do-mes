import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { CreateBillValueDto } from './dto/create-bill-value.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { UserMonthlyBillResponseDto } from './dto/user-monthly-bills-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserFromJwt } from '../auth/jwt.strategy';

@ApiTags('Contas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}
  @Post()
  @ApiOperation({ summary: 'Criar nova conta' })
  @ApiResponse({ status: 201, description: 'Conta criada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Porcentagens inválidas ou usuário não encontrado',
  })
  create(@Body() createBillDto: CreateBillDto) {
    return this.billsService.create(createBillDto);
  }
  @Get()
  @ApiOperation({ summary: 'Listar todas as contas' })
  @ApiResponse({ status: 200, description: 'Lista de contas' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filtrar contas por usuário',
  })
  findAll(
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
  ) {
    if (userId) {
      return this.billsService.findByUser(userId);
    }
    return this.billsService.findAll();
  }

  @Get('my-bills/monthly')
  @ApiOperation({
    summary: 'Listar contas do usuário autenticado para um mês específico',
    description:
      'Retorna todas as contas do usuário autenticado no mês/ano especificado com valores, vencimentos e status de pagamento',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de contas do mês',
    type: [UserMonthlyBillResponseDto],
  })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
    description: 'Mês (1-12)',
    example: 10,
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Ano',
    example: 2025,
  })
  async getMyMonthlyBills(
    @CurrentUser() user: UserFromJwt,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return await this.billsService.getUserMonthlyBills(
      user.userId,
      month,
      year,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar conta por ID' })
  @ApiResponse({ status: 200, description: 'Conta encontrada' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.billsService.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conta' })
  @ApiResponse({ status: 200, description: 'Conta atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBillDto: UpdateBillDto,
  ) {
    return this.billsService.update(id, updateBillDto);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Remover conta' })
  @ApiResponse({ status: 200, description: 'Conta removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.billsService.remove(id);
  }
  @Patch(':billId/users/:userId/paid')
  @ApiOperation({ summary: 'Marcar conta como paga/não paga para um usuário' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta ou usuário não encontrado' })
  @ApiQuery({
    name: 'isPaid',
    required: true,
    type: Boolean,
    description: 'true para marcar como pago, false para não pago',
  })
  async markAsPaid(
    @Param('billId', ParseIntPipe) billId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Query('isPaid') isPaid: string,
  ) {
    const isPaidBool = isPaid === 'true';
    await this.billsService.markAsPaid(billId, userId, isPaidBool);
    return { message: 'Status atualizado com sucesso' };
  }

  @Patch(':billId/invite/:userId')
  @ApiOperation({ summary: 'Aceitar ou rejeitar convite de conta' })
  @ApiResponse({ status: 200, description: 'Convite respondido com sucesso' })
  @ApiResponse({ status: 404, description: 'Convite não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Convite já foi respondido anteriormente',
  })
  async acceptInvite(
    @Param('billId', ParseIntPipe) billId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() acceptInviteDto: AcceptInviteDto,
  ) {
    await this.billsService.acceptInvite(
      billId,
      userId,
      acceptInviteDto.status,
    );
    return { message: 'Convite respondido com sucesso' };
  }

  @Get('invites/pending/:userId')
  @ApiOperation({ summary: 'Listar convites pendentes de um usuário' })
  @ApiResponse({ status: 200, description: 'Lista de convites pendentes' })
  async getPendingInvites(@Param('userId', ParseIntPipe) userId: number) {
    return await this.billsService.getPendingInvites(userId);
  }

  @Post('values')
  @ApiOperation({
    summary: 'Criar valor mensal para conta recorrente',
  })
  @ApiResponse({ status: 201, description: 'Valor criado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Valor já existe ou conta não é recorrente',
  })
  async createBillValue(@Body() createBillValueDto: CreateBillValueDto) {
    return await this.billsService.createBillValue(createBillValueDto);
  }

  @Patch('values/:id')
  @ApiOperation({ summary: 'Atualizar valor mensal de conta recorrente' })
  @ApiResponse({ status: 200, description: 'Valor atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Valor não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Valores de contas parceladas não podem ser editados',
  })
  @ApiQuery({
    name: 'value',
    required: true,
    type: Number,
    description: 'Novo valor',
  })
  async updateBillValue(
    @Param('id', ParseIntPipe) id: number,
    @Query('value') value: string,
  ) {
    return await this.billsService.updateBillValue(id, parseFloat(value));
  }

  @Get(':id/values')
  @ApiOperation({ summary: 'Buscar valores mensais de uma conta' })
  @ApiResponse({ status: 200, description: 'Lista de valores mensais' })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Filtrar por mês (1-12)',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Filtrar por ano',
  })
  async getBillValues(
    @Param('id', ParseIntPipe) id: number,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    return await this.billsService.getBillValues(id, month, year);
  }
}
