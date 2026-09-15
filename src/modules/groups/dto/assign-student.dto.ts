import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignStudentDto {
  @ApiProperty({ example: 1, description: "O'quvchi ID si" })
  @IsNumber()
  @IsNotEmpty()
  student_id: number;
}
