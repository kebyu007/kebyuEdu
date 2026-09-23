import { IsNumber, IsOptional, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HomeworkStatus } from '@prisma/client';

export class GradeHomeworkDto {
  @ApiPropertyOptional({ example: 100, description: 'Baho (Maksimal 100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100, { message: "Baho 100 dan oshmasligi kerak!" })
  grade?: number;

  @ApiProperty({ enum: HomeworkStatus, example: 'ACCEPTED' })
  @IsEnum(HomeworkStatus)
  status: HomeworkStatus;
}
