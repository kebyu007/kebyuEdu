import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  group_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  teacher_id: number;

  @ApiProperty({ example: 'Ingliz tili 1-dars' })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({ example: 'Present Simple haqida', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-09-21' })
  @IsString()
  @IsNotEmpty()
  date: string;
}
