import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateBillValueDto {
  @ApiProperty({
    description: 'Novo valor da conta para o mês especificado',
    example: 180.0,
  })
  @IsNumber()
  @Min(0)
  value: number;
}
