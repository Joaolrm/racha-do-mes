import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BillType } from '../../entities/bill.entity';

export class ParticipantDto {
  @ApiProperty({
    description: 'ID do usuário participante',
    example: 1,
  })
  @IsInt()
  user_id: number;

  @ApiProperty({
    description: 'Porcentagem de participação (0-100)',
    example: 50,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  share_percentage: number;
}

export class CreateBillDto {
  @ApiProperty({
    description: 'Descrição da conta',
    example: 'Aluguel do apartamento',
  })
  @IsString()
  descript: string;

  @ApiProperty({
    description: 'Tipo da conta',
    enum: BillType,
    example: BillType.RECORRENTE,
  })
  @IsEnum(BillType)
  type: BillType;

  @ApiProperty({
    description: 'Dia do mês de vencimento (1-31)',
    example: 15,
    minimum: 1,
    maximum: 31,
  })
  @IsInt()
  @Min(1)
  @Max(31)
  due_day: number;

  @ApiProperty({
    description:
      'Valor total da conta (obrigatório apenas para contas parceladas)',
    example: 1500.0,
    required: false,
  })
  @ValidateIf((o) => o.type === BillType.PARCELADA)
  @IsNumber()
  @Min(0)
  total_value?: number;

  @ApiProperty({
    description:
      'Número de parcelas (obrigatório apenas para contas parceladas)',
    example: 12,
    required: false,
  })
  @ValidateIf((o) => o.type === BillType.PARCELADA)
  @IsInt()
  @Min(1)
  installments?: number;

  @ApiProperty({
    description:
      'Mês de início (1-12, obrigatório apenas para contas parceladas)',
    example: 10,
    required: false,
  })
  @ValidateIf((o) => o.type === BillType.PARCELADA)
  @IsInt()
  @Min(1)
  @Max(12)
  start_month?: number;

  @ApiProperty({
    description: 'Ano de início (obrigatório apenas para contas parceladas)',
    example: 2025,
    required: false,
  })
  @ValidateIf((o) => o.type === BillType.PARCELADA)
  @IsInt()
  @Min(2000)
  start_year?: number;

  @ApiProperty({
    description:
      'Valor mensal (obrigatório apenas para contas recorrentes no mês atual)',
    example: 150.0,
    required: false,
  })
  @ValidateIf((o) => o.type === BillType.RECORRENTE)
  @IsNumber()
  @Min(0)
  current_month_value?: number;

  @ApiProperty({
    description: 'Lista de participantes da conta',
    type: [ParticipantDto],
    example: [
      { user_id: 1, share_percentage: 50 },
      { user_id: 2, share_percentage: 50 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants: ParticipantDto[];
}
