import { IsArray, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AttendanceItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  student_id: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isPresent: boolean;
}

export class SubmitAttendanceDto {
  @ApiProperty({ type: [AttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemDto)
  attendances: AttendanceItemDto[];
}
