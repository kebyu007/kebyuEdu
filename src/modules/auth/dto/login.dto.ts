import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: '+998933921177',
    description: 'Foydalanuvchining telefon raqami',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456', description: 'Foydalanuvchi paroli' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
