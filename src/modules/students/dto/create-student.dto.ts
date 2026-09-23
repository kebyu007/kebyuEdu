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

export class CreateStudentDto {
  @ApiProperty({ example: 'Eshmat' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Toshmatov' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber('UZ')
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ required: false, example: 'eshmat@student.uz' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: 'password123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ required: false, example: 'Toshkent sh., Yunusobod' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    required: false,
    example: '2005-05-20',
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
    description: "O'quvchining profil rasmi",
  })
  @IsOptional()
  photo?: string;
}
