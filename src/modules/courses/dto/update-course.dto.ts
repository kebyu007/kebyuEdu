import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { Status } from '@prisma/client';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @ApiProperty({
    required: false,
    enum: Status,
    description: 'Kurs holati (active / inactive)',
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
