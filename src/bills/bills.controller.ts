import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
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
}
