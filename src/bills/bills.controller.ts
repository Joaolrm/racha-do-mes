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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
}
