import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateGroupDto } from './create-group.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { GroupStatus } from '@prisma/client';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @ApiProperty({
    required: false,
    enum: GroupStatus,
    description: 'Guruh holati (active / inactive / planned / completed)',
  })
  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;
}
