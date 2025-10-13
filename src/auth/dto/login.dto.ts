import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email ou telefone do usuário',
    example: 'joao@email.com',
  })
  @IsString()
  emailOrPhone: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'senha123',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
