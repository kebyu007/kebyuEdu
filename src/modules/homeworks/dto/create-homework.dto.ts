import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateHomeworkDto {
  @ApiProperty({ example: 1, description: 'Dars ID si' })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  lesson_id: number;

  @ApiProperty({
    example: 'Men uy vazifasini qildim',
    description: 'Vazifa nomi',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Vazifa fayli (ixtiyoriy)',
  })
  @IsOptional()
  file?: any;
}
