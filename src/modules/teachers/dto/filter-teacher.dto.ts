import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';

export class FilterTeacherDto {
  @ApiProperty({
    required: false,
    enum: Status,
    description: "O'qituvchi holati bo'yicha filtrlash (active yoki inactive)",
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({
    required: false,
    description: 'Ism, familiya yoki telefon orqali qidirish',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    default: 1,
    description: 'Sahifa raqami',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    default: 10,
    description: 'Sahifadagi elementlar soni',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
