import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsDate,
  Matches,
  IsArray,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateGroupDto {
  @ApiProperty({ example: 'Ingliz tili noldan', description: 'Guruh nomi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1, description: 'Kurs ID si' })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  course_id: number;

  @ApiProperty({ example: 1, description: 'Xona ID si' })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  room_id: number;

  @ApiProperty({
    example: '2023-09-01',
    description: 'Guruh dars boshlash sanasi',
  })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  start_date: Date;

  @ApiProperty({ example: '14:00', description: 'Dars boshlanish vaqti' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Vaqt formati HH:MM bo'lishi kerak",
  })
  start_time: string;

  @ApiProperty({ example: 15, description: "Guruhning maksimal sig'imi" })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  max_student: number;

  @ApiProperty({
    example: [1, 3, 5],
    description: 'Dars kunlari (1 dan 7 gacha, 1 = Dushanba)',
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  weekday: number[];
}
