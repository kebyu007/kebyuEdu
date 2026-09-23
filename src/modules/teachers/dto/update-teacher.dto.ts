import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateTeacherDto } from './create-teacher.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { Status } from '@prisma/client';

export class UpdateTeacherDto extends PartialType(CreateTeacherDto) {
  @ApiProperty({
    required: false,
    enum: Status,
    description: "O'qituvchi holati (active / inactive)",
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
