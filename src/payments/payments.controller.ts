import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserFromJwt } from '../auth/jwt.strategy';

@ApiTags('Pagamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('receipt_photo', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Apenas imagens são permitidas!') as any, false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Registrar novo pagamento',
    description:
      'Registra um pagamento e atualiza automaticamente os saldos entre os participantes. Pode incluir foto do comprovante.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['bill_value_id', 'payment_value', 'payed_at'],
      properties: {
        bill_value_id: {
          type: 'integer',
          example: 1,
          description: 'ID da parcela (BillValue)',
        },
        payment_value: { type: 'number', example: 750.0 },
        payed_at: { type: 'string', example: '2025-10-11T18:00:00.000Z' },
        receipt_photo: {
          type: 'string',
          format: 'binary',
          description: 'Foto do comprovante (opcional)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Pagamento registrado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Usuário não participa da conta',
  })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  create(
    @CurrentUser() user: UserFromJwt,
    @Body() createPaymentDto: CreatePaymentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.paymentsService.create(
      user.userId,
      createPaymentDto,
      file?.buffer
        ? { buffer: file.buffer, mimetype: file.mimetype }
        : undefined,
    );
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

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('receipt_photo', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Apenas imagens são permitidas!') as any, false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Atualizar pagamento',
    description:
      'Substitui completamente os dados do pagamento. Valor e data são obrigatórios. Apenas o dono pode editar.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['payment_value', 'payed_at'],
      properties: {
        payment_value: {
          type: 'number',
          example: 800.0,
          description: 'Valor do pagamento (obrigatório)',
        },
        payed_at: {
          type: 'string',
          example: '2025-10-12T18:00:00.000Z',
          description: 'Data do pagamento (obrigatório)',
        },
        remove_receipt: {
          type: 'boolean',
          example: false,
          description:
            'Se true, remove a foto do comprovante (opcional, padrão: false)',
        },
        receipt_photo: {
          type: 'string',
          format: 'binary',
          description:
            'Nova foto do comprovante (opcional, substitui a anterior se existir)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Pagamento atualizado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Você não pode editar pagamentos de outros usuários',
  })
  async update(
    @CurrentUser() user: UserFromJwt,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return await this.paymentsService.update(
      id,
      user.userId,
      updatePaymentDto,
      file?.buffer
        ? { buffer: file.buffer, mimetype: file.mimetype }
        : undefined,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover pagamento',
    description:
      'ATENÇÃO: Remover um pagamento não reverte automaticamente os saldos.',
  })
  @ApiResponse({ status: 200, description: 'Pagamento removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }

  @Get(':id/receipt')
  @ApiOperation({
    summary: 'Buscar foto do comprovante de pagamento',
    description: 'Retorna a foto do comprovante se existir',
  })
  @ApiResponse({
    status: 200,
    description: 'Foto do comprovante',
    content: {
      'image/jpeg': {},
      'image/png': {},
      'image/gif': {},
      'image/webp': {},
    },
  })
  @ApiResponse({ status: 404, description: 'Comprovante não encontrado' })
  async getReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const payment = await this.paymentsService.findOne(id);

    if (!payment.receipt_photo) {
      throw new NotFoundException('Este pagamento não possui comprovante');
    }

    const mimeType = payment.receipt_photo_mime || 'image/jpeg';
    res.setHeader('Content-Type', mimeType);
    return res.send(payment.receipt_photo);
  }
}
