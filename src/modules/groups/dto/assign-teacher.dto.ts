import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTeacherDto {
  @ApiProperty({ example: 1, description: "O'qituvchi ID si" })
  @IsNumber()
  @IsNotEmpty()
  teacher_id: number;
}
