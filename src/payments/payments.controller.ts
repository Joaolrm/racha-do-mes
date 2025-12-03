import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
      'Registra um pagamento e atualiza automaticamente os saldos entre os participantes. Pode incluir foto do comprovante. Para contas recorrentes, pode criar automaticamente o bill-value se não existir usando bill_id, month e year.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['payment_value', 'payed_at'],
      properties: {
        bill_value_id: {
          type: 'integer',
          example: 1,
          description:
            'ID da parcela (BillValue). Obrigatório se bill_id, month e year não forem fornecidos.',
        },
        bill_id: {
          type: 'integer',
          example: 1,
          description:
            'ID da conta. Obrigatório se bill_value_id não for fornecido.',
        },
        month: {
          type: 'integer',
          example: 10,
          description:
            'Mês (1-12). Obrigatório se bill_value_id não for fornecido.',
        },
        year: {
          type: 'integer',
          example: 2025,
          description: 'Ano. Obrigatório se bill_value_id não for fornecido.',
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
}
