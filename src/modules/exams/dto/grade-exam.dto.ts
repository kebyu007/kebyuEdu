import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class GradeExamDto {
  @ApiProperty({ example: 85 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  score: number;
}
