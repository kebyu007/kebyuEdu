import {
  IsString,
  IsNotEmpty,
  IsPhoneNumber,
  IsEmail,
  MinLength,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeacherDto {
  @ApiProperty({ example: 'Alisher' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Navoiy' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber('UZ')
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'alisher.navoiy@edu.uz' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: 'password123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'Toshkent sh., Chilonzor' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    required: false,
    example: '1995-10-15',
    description: "Tug'ilgan sana",
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  birth_date?: Date;

  @ApiProperty({
    required: false,
    type: 'string',
    format: 'binary',
    description: "O'qituvchining profil rasmi",
  })
  @IsOptional()
  photo?: string;
}
