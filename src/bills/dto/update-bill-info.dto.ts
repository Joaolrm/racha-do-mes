import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateBillInfoDto {
  @ApiProperty({
    description: 'Nova descrição da conta',
    example: 'Aluguel do apartamento - Centro',
    required: false,
  })
  @IsOptional()
  @IsString()
  descript?: string;

  @ApiProperty({
    description:
      'Novo valor total da conta (apenas para contas parceladas). Não altera os valores individuais já criados.',
    example: 1800.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  total_value?: number;
}
