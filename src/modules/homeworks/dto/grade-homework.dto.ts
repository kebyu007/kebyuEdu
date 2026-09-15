import { IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HomeworkStatus } from '@prisma/client';

export class GradeHomeworkDto {
  @ApiPropertyOptional({ example: 5, description: 'Baho' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grade?: number;

  @ApiProperty({ enum: HomeworkStatus, example: 'ACCEPTED' })
  @IsEnum(HomeworkStatus)
  status: HomeworkStatus;
}
