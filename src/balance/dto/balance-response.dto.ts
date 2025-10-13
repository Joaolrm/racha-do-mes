import { ApiProperty } from '@nestjs/swagger';

export class BalanceResponseDto {
  @ApiProperty({
    description: 'ID do usuário devedor',
    example: 1,
  })
  debtor_user_id: number;

  @ApiProperty({
    description: 'Nome do usuário devedor',
    example: 'João da Silva',
  })
  debtor_name: string;

  @ApiProperty({
    description: 'ID do usuário credor',
    example: 2,
  })
  borrower_user_id: number;

  @ApiProperty({
    description: 'Nome do usuário credor',
    example: 'Maria Santos',
  })
  borrower_name: string;

  @ApiProperty({
    description: 'Valor da dívida',
    example: 750.0,
  })
  value: number;
}

export class UserBalanceSummaryDto {
  @ApiProperty({
    description: 'Total que o usuário deve',
    example: 1500.0,
  })
  total_debts: number;

  @ApiProperty({
    description: 'Total que devem ao usuário',
    example: 750.0,
  })
  total_credits: number;

  @ApiProperty({
    description: 'Saldo líquido (negativo = deve, positivo = a receber)',
    example: -750.0,
  })
  net_balance: number;

  @ApiProperty({
    description: 'Dívidas individuais',
    type: [BalanceResponseDto],
  })
  debts: BalanceResponseDto[];

  @ApiProperty({
    description: 'Créditos individuais',
    type: [BalanceResponseDto],
  })
  credits: BalanceResponseDto[];
}
