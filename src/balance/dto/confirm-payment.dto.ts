import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({
    description:
      'Valor do pagamento a confirmar (opcional, se não informado confirma o total)',
    example: 100.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  payment_value?: number;
}
