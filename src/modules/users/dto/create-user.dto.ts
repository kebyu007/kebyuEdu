import { Status, UserRoles } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsDate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Ali' })
  @IsString()
  first_name: string;

  @ApiProperty({ example: 'Valiyev' })
  @IsString()
  last_name: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;

  @ApiProperty({ enum: UserRoles, example: UserRoles.TEACHER })
  @IsEnum(UserRoles)
  role: UserRoles;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'ali@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'Tashkent' })
  @IsString()
  address: string;

  @ApiProperty({ enum: Status, example: Status.active })
  @IsEnum(Status)
  status: Status;

  @ApiPropertyOptional({ example: '1995-10-15' })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  birth_date?: Date;

  @ApiPropertyOptional({
    example: { permissions: { users: ['create', 'read'] } },
  })
  @IsOptional()
  @Transform(({ value }) => {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (e) {
      return value;
    }
  })
  attributes?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Profil rasmi',
  })
  @IsOptional()
  @IsString()
  photo: string;
}
