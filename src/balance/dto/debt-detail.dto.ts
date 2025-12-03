import { ApiProperty } from '@nestjs/swagger';

export class DebtDetailItemDto {
  @ApiProperty({
    description: 'ID do histórico',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID da conta relacionada',
    example: 5,
    nullable: true,
  })
  bill_id: number | null;

  @ApiProperty({
    description: 'Descrição da transação',
    example: 'Pagamento de Aluguel (10/2025)',
  })
  descript: string;

  @ApiProperty({
    description: 'Valor da transação',
    example: 250.0,
  })
  value: number;

  @ApiProperty({
    description: 'Data da transação',
    example: '2025-10-15T10:30:00.000Z',
  })
  created_at: Date;
}

export class DebtDetailDto {
  @ApiProperty({
    description: 'ID do outro usuário',
    example: 2,
  })
  user_id: number;

  @ApiProperty({
    description: 'Nome do outro usuário',
    example: 'Maria Santos',
  })
  user_name: string;

  @ApiProperty({
    description: 'Valor total da dívida',
    example: 750.0,
  })
  total_value: number;

  @ApiProperty({
    description: 'Histórico detalhado das transações',
    type: [DebtDetailItemDto],
  })
  history: DebtDetailItemDto[];
}
