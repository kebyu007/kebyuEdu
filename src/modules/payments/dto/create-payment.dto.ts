import { IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  student_id: number;

  @ApiProperty({ example: 500000, description: "To'lov summasi" })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: 'CASH',
    description: "To'lov usuli",
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ example: '2023-10', description: 'Qaysi oy uchun' })
  @IsString()
  @IsOptional()
  month?: string;

  @ApiPropertyOptional({ example: "Naqd pul orqali ofisda to'landi" })
  @IsString()
  @IsOptional()
  comment?: string;
}
