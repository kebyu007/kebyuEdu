import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateStudentDto } from './create-student.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { Status } from '@prisma/client';

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @ApiProperty({
    required: false,
    enum: Status,
    description: "O'quvchi holati (active / inactive)",
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
