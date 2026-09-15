import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SubmitHomeworkAnswerDto {
  @ApiProperty({ example: 1 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  homework_id: number;

  @ApiProperty({ example: 'Vazifamni yukladim' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  file?: any;
}
