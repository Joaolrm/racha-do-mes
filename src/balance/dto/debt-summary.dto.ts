import { ApiProperty } from '@nestjs/swagger';

export class DebtSummaryDto {
  @ApiProperty({
    description: 'ID do usuário para quem você deve',
    example: 2,
  })
  user_id: number;

  @ApiProperty({
    description: 'Nome do usuário para quem você deve',
    example: 'Maria Santos',
  })
  user_name: string;

  @ApiProperty({
    description: 'Valor total que você deve para esta pessoa',
    example: 750.0,
  })
  total_value: number;
}

export class CreditSummaryDto {
  @ApiProperty({
    description: 'ID do usuário que te deve',
    example: 3,
  })
  user_id: number;

  @ApiProperty({
    description: 'Nome do usuário que te deve',
    example: 'João da Silva',
  })
  user_name: string;

  @ApiProperty({
    description: 'Valor total que esta pessoa te deve',
    example: 500.0,
  })
  total_value: number;
}
