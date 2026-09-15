import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ResetMethod {
  EMAIL = 'email',
  TELEGRAM = 'telegram',
}

export class ForgotPasswordDto {
  @ApiProperty({
    enum: ResetMethod,
    example: 'telegram',
    description: 'Tiklash usuli (email yoki telegram)',
  })
  @IsEnum(ResetMethod)
  @IsNotEmpty()
  method: ResetMethod;

  @ApiProperty({
    example: '+998901234567',
    description: 'Telefon raqami yoki Email',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;
}
