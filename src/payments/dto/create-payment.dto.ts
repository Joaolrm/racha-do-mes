import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsInt, IsDateString, Min, Max } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID da conta',
    example: 1,
  })
  @IsInt()
  bill_id: number;

  @ApiProperty({
    description: 'Mês do pagamento (1-12)',
    example: 10,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    description: 'Ano do pagamento',
    example: 2025,
  })
  @IsInt()
  @Min(2000)
  year: number;

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
