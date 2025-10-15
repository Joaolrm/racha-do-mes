import { ApiProperty } from '@nestjs/swagger';

export class UserMonthlyBillResponseDto {
  @ApiProperty({
    description: 'ID da conta',
    example: 1,
  })
  bill_id: number;

  @ApiProperty({
    description: 'Descrição da conta',
    example: 'Aluguel do apartamento',
  })
  descript: string;

  @ApiProperty({
    description: 'Data de vencimento',
    example: '2025-10-15T00:00:00.000Z',
  })
  due_date: Date;

  @ApiProperty({
    description: 'Valor da conta no mês especificado',
    example: 150.0,
  })
  value: number;

  @ApiProperty({
    description: 'Se o usuário já pagou sua parte',
    example: false,
  })
  is_paid: boolean;

  @ApiProperty({
    description: 'Porcentagem de participação do usuário na conta',
    example: 50,
  })
  share_percentage: number;

  @ApiProperty({
    description:
      'Valor que o usuário deve pagar (value * share_percentage / 100)',
    example: 75.0,
  })
  user_value: number;
}
