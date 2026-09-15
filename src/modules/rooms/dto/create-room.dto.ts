import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateRoomDto {
  @ApiProperty({ example: '10-xona', description: 'Xona nomi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 20, description: "Xona sig'imi (o'quvchilar soni)" })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  capacity: number;
}
