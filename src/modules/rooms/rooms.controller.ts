import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { FilterRoomDto } from './dto/filter-room.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';

@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: "Yangi xona qo'shish" })
  @RequirePermissions('rooms', 'create')
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  @ApiOperation({ summary: "Barcha xonalarni ro'yxatini olish" })
  @RequirePermissions('rooms', 'read')
  findAll(@Query() filterDto: FilterRoomDto) {
    return this.roomsService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: "Bitta xona haqida ma'lumot olish" })
  @RequirePermissions('rooms', 'read')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Xona ma'lumotlarini tahrirlash" })
  @RequirePermissions('rooms', 'update')
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(+id, updateRoomDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xonani arxivlash (Soft delete)' })
  @RequirePermissions('rooms', 'delete')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(+id);
  }
}
