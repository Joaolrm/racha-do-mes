import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsInt,
  IsDateString,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @ApiProperty({
    description:
      'ID da parcela (BillValue). Obrigatório se bill_id, month e year não forem fornecidos.',
    example: 1,
    required: false,
  })
  @ValidateIf((o: CreatePaymentDto) => !o.bill_id || !o.month || !o.year)
  @Type(() => Number)
  @IsInt()
  bill_value_id?: number;

  @ApiProperty({
    description: 'ID da conta. Obrigatório se bill_value_id não for fornecido.',
    example: 1,
    required: false,
  })
  @ValidateIf((o: CreatePaymentDto) => !o.bill_value_id)
  @Type(() => Number)
  @IsInt()
  bill_id?: number;

  @ApiProperty({
    description: 'Mês (1-12). Obrigatório se bill_value_id não for fornecido.',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 12,
  })
  @ValidateIf((o: CreatePaymentDto) => !o.bill_value_id)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiProperty({
    description: 'Ano. Obrigatório se bill_value_id não for fornecido.',
    example: 2025,
    required: false,
    minimum: 2000,
  })
  @ValidateIf((o: CreatePaymentDto) => !o.bill_value_id)
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;

  @ApiProperty({
    description: 'Valor pago',
    example: 750.0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  payment_value: number;

  @ApiProperty({
    description: 'Data do pagamento',
    example: '2025-10-11T18:00:00.000Z',
  })
  @IsDateString()
  payed_at: string;
}
