import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateLessonVideoDto {
  @ApiProperty({ example: 1 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  lesson_id: number;

  @ApiProperty({ example: 1 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  group_id: number;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  file?: any;
}
