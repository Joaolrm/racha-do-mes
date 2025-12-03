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
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { UserMonthlyBillResponseDto } from './dto/user-monthly-bills-response.dto';
import { UpdateBillInfoDto } from './dto/update-bill-info.dto';
import { UpdateBillValueDto } from './dto/update-bill-value.dto';
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
  @ApiOperation({
    summary: 'Criar nova conta',
    description:
      'O usuário autenticado será automaticamente o dono da conta e deve estar entre os participantes',
  })
  @ApiResponse({ status: 201, description: 'Conta criada com sucesso' })
  @ApiResponse({
    status: 400,
    description:
      'Porcentagens inválidas, usuário não encontrado ou dono não está entre os participantes',
  })
  create(
    @CurrentUser() user: UserFromJwt,
    @Body() createBillDto: CreateBillDto,
  ) {
    return this.billsService.create(user.userId, createBillDto);
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

  @Get('invites/pending')
  @ApiOperation({
    summary: 'Listar convites pendentes do usuário autenticado',
  })
  @ApiResponse({ status: 200, description: 'Lista de convites pendentes' })
  async getPendingInvites(@CurrentUser() user: UserFromJwt) {
    return await this.billsService.getPendingInvites(user.userId);
  }

  @Patch(':billId/invite')
  @ApiOperation({ summary: 'Aceitar ou rejeitar convite de conta' })
  @ApiResponse({ status: 200, description: 'Convite respondido com sucesso' })
  @ApiResponse({ status: 404, description: 'Convite não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Convite já foi respondido anteriormente',
  })
  async acceptInvite(
    @CurrentUser() user: UserFromJwt,
    @Param('billId', ParseIntPipe) billId: number,
    @Body() acceptInviteDto: AcceptInviteDto,
  ) {
    await this.billsService.acceptInvite(
      billId,
      user.userId,
      acceptInviteDto.status,
    );
    return { message: 'Convite respondido com sucesso' };
  }

  @Patch(':billId')
  @ApiOperation({
    summary: 'Atualizar informações gerais da conta',
    description:
      'Permite atualizar a descrição e o valor total (apenas para contas parceladas). Apenas o dono pode atualizar.',
  })
  @ApiResponse({ status: 200, description: 'Conta atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Apenas o dono da conta pode atualizar',
  })
  @ApiResponse({
    status: 400,
    description: 'Contas recorrentes não possuem valor total',
  })
  async updateBillInfo(
    @CurrentUser() user: UserFromJwt,
    @Param('billId', ParseIntPipe) billId: number,
    @Body() updateBillInfoDto: UpdateBillInfoDto,
  ) {
    return await this.billsService.updateBillInfo(
      billId,
      user.userId,
      updateBillInfoDto,
    );
  }

  @Get(':billId/values')
  @ApiOperation({
    summary: 'Listar valores individuais de uma conta',
    description:
      'Retorna todos os valores (mês a mês) de uma conta específica. Pode filtrar por mês e ano.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de valores da conta',
  })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
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
    @Param('billId', ParseIntPipe) billId: number,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    return await this.billsService.getBillValues(billId, month, year);
  }

  @Patch(':billId/values/:month/:year')
  @ApiOperation({
    summary: 'Atualizar ou criar valor da conta para um mês específico',
    description:
      'Permite atualizar o valor de uma conta em um mês/ano específico. Se o bill-value não existir, ele será criado automaticamente. Apenas o dono pode atualizar.',
  })
  @ApiResponse({
    status: 200,
    description: 'Valor da conta atualizado ou criado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Apenas o dono da conta pode atualizar os valores',
  })
  async updateBillValue(
    @CurrentUser() user: UserFromJwt,
    @Param('billId', ParseIntPipe) billId: number,
    @Param('month', ParseIntPipe) month: number,
    @Param('year', ParseIntPipe) year: number,
    @Body() updateBillValueDto: UpdateBillValueDto,
  ) {
    return await this.billsService.updateBillValue(
      billId,
      month,
      year,
      user.userId,
      updateBillValueDto,
    );
  }

  @Delete(':billId')
  @ApiOperation({
    summary: 'Deletar uma conta',
    description:
      'Apenas o dono da conta pode deletá-la. Todos os dados relacionados serão removidos.',
  })
  @ApiResponse({ status: 200, description: 'Conta deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Apenas o dono da conta pode deletá-la',
  })
  async deleteBill(
    @CurrentUser() user: UserFromJwt,
    @Param('billId', ParseIntPipe) billId: number,
  ): Promise<{ message: string }> {
    await this.billsService.deleteBill(billId, user.userId);
    return { message: 'Conta deletada com sucesso' };
  }
}
