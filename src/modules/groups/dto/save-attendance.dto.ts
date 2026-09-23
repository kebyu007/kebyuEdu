import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveAttendanceDto {
  @ApiProperty({
    description: "Davomat ma'lumotlari: { [lessonId]: { [studentId]: boolean | null } }",
    example: { '1': { '1': true, '2': false, '3': null } },
  })
  @IsObject()
  attendances: Record<number, Record<number, boolean | null>>;
}
