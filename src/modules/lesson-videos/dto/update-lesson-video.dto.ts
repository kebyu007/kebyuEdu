import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLessonVideoDto {
  @ApiPropertyOptional({ example: '1-dars videosi Yangilangan' })
  @IsString()
  @IsOptional()
  title?: string;
}
