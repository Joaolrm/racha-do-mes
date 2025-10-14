import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min, Max } from 'class-validator';

export class CreateBillValueDto {
  @ApiProperty({
    description: 'ID da conta',
    example: 1,
  })
  @IsInt()
  bill_id: number;

  @ApiProperty({
    description: 'Mês (1-12)',
    example: 10,
    minimum: 1,
    maximum: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    description: 'Ano',
    example: 2025,
    minimum: 2000,
  })
  @IsInt()
  @Min(2000)
  year: number;

  @ApiProperty({
    description: 'Valor da conta neste mês',
    example: 150.0,
  })
  @IsNumber()
  @Min(0)
  value: number;
}
