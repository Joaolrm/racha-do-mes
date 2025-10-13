import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

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
    description: 'Valor total da conta',
    example: 1500.0,
  })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({
    description: 'Data de vencimento',
    example: '2025-10-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiProperty({
    description: 'Número de parcelas',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  payment_number?: number;

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
