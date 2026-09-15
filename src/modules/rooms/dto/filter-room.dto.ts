import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { Status } from '@prisma/client';

export class FilterRoomDto {
  @ApiPropertyOptional({ description: "Qidirish (xona nomi bo'yicha)" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: Status,
    description: "Xona holati bo'yicha filtrlash",
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({ default: 1, description: 'Sahifa raqami' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 10,
    description: 'Sahifadagi elementlar soni',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
