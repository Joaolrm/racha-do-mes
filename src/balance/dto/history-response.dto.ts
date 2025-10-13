import { ApiProperty } from '@nestjs/swagger';

export class HistoryResponseDto {
  @ApiProperty({
    description: 'ID do histórico',
    example: 1,
  })
  id: number;

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
    description: 'ID da conta relacionada (opcional)',
    example: 1,
    required: false,
  })
  bill_id?: number;

  @ApiProperty({
    description: 'Descrição da transação',
    example: 'Pagamento de aluguel - Outubro/2025',
  })
  descript: string;

  @ApiProperty({
    description: 'Valor da transação',
    example: 750.0,
  })
  value: number;

  @ApiProperty({
    description: 'Data da transação',
    example: '2025-10-11T18:00:00.000Z',
  })
  created_at: Date;
}
