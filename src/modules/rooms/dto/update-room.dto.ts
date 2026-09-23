import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateRoomDto } from './create-room.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { Status } from '@prisma/client';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @ApiProperty({
    required: false,
    enum: Status,
    description: 'Xona holati (active / inactive)',
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
