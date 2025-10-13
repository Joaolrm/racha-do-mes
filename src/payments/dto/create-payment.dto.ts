import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsInt, IsDateString, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID da conta',
    example: 1,
  })
  @IsInt()
  bill_id: number;

  @ApiProperty({
    description: 'Valor pago',
    example: 750.0,
  })
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
