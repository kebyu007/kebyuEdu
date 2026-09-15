import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { GroupStatus } from '@prisma/client';

export class FilterGroupDto {
  @ApiPropertyOptional({ description: "Qidirish (guruh nomi bo'yicha)" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: GroupStatus,
    description: "Guruh holati bo'yicha filtrlash",
  })
  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;

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
