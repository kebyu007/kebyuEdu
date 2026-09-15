import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty({ example: 'Ingliz tili (Beginner)', description: 'Kurs nomi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Sifatli dars',
    description: "Kurs haqida batafsil ma'lumot",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 500000, description: "Kurs narxi (so'mda)" })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 24, description: 'Kurs davomiyligi (soat hisobida)' })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  duration_hours: number;

  @ApiProperty({ example: 3, description: 'Kurs davomiyligi (oy hisobida)' })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  duration_month: number;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Kursning muqova rasmi',
  })
  @IsOptional()
  photo?: string;
}
