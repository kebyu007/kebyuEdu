import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsString, IsOptional } from 'class-validator';

export class CreateExamDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  @IsNumberString()
  group_id: string;

  @ApiProperty({ example: 'Yakuniy imtihon' })
  @IsNotEmpty()
  @IsString()
  topic: string;

  @ApiPropertyOptional({ example: 'Imtihon shartlari' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '60' })
  @IsNotEmpty()
  @IsNumberString()
  minScore: string;

  @ApiProperty({ example: '100' })
  @IsNotEmpty()
  @IsNumberString()
  maxScore: string;

  @ApiPropertyOptional({ example: '24' })
  @IsOptional()
  @IsNumberString()
  deadline_hours?: string;
}
