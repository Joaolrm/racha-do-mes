import { ApiProperty } from '@nestjs/swagger';
import { BillType } from '../../entities/bill.entity';

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
    description: 'Tipo da conta',
    enum: BillType,
    example: BillType.RECORRENTE,
  })
  type: BillType;

  @ApiProperty({
    description:
      'Número da parcela atual (apenas para contas parceladas, null para recorrentes)',
    example: 1,
    required: false,
    nullable: true,
  })
  installment_number: number | null;

  @ApiProperty({
    description:
      'Total de parcelas (apenas para contas parceladas, null para recorrentes)',
    example: 10,
    required: false,
    nullable: true,
  })
  total_installments: number | null;

  @ApiProperty({
    description:
      'Parcela formatada (exemplo: "1/10", apenas para contas parceladas)',
    example: '1/10',
    required: false,
    nullable: true,
  })
  installment_info: string | null;

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
