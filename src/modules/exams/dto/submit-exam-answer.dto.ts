import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SubmitExamAnswerDto {
  @ApiPropertyOptional({ example: 'Men vazifani githubga joyladim: link' })
  @IsOptional()
  @IsString()
  answer_text?: string;
}
