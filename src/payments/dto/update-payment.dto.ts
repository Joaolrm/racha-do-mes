import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdatePaymentDto {
  @ApiProperty({
    description: 'Valor do pagamento',
    example: 800.0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  payment_value: number;

  @ApiProperty({
    description: 'Data do pagamento',
    example: '2025-10-12T18:00:00.000Z',
  })
  @IsDateString()
  payed_at: string;

  @ApiProperty({
    description: 'Se true, remove a foto do comprovante',
    example: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  remove_receipt?: boolean;

  // Campo para aceitar o arquivo vazio sem erro de validação
  // O arquivo real é processado pelo FileInterceptor
  @ApiProperty({
    description: 'Foto do comprovante (processado pelo FileInterceptor)',
    required: false,
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  receipt_photo?: any;
}
