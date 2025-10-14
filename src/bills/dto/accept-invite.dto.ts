import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserBillStatus } from '../../entities/user-bill.entity';

export class AcceptInviteDto {
  @ApiProperty({
    description: 'Status do convite',
    enum: [UserBillStatus.ACCEPTED, UserBillStatus.REJECTED],
    example: UserBillStatus.ACCEPTED,
  })
  @IsEnum([UserBillStatus.ACCEPTED, UserBillStatus.REJECTED])
  status: UserBillStatus.ACCEPTED | UserBillStatus.REJECTED;
}
