import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';

export class FilterTeacherDto {
  @ApiProperty({
    required: false,
    enum: Status,
    description:
      "O'qituvchi holati bo'yicha filtrlash (masalan: inactive/archived lar uchun)",
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
}
