import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsInt, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID da parcela (BillValue)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  bill_value_id: number;

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
