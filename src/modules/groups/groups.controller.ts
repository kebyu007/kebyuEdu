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
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { FilterGroupDto } from './dto/filter-group.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { AssignStudentDto } from './dto/assign-student.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: "Yangi guruh qo'shish" })
  @RequirePermissions('groups', 'create')
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto);
  }

  @Get()
  @ApiOperation({ summary: "Barcha guruhlarni ro'yxatini olish" })
  @RequirePermissions('groups', 'read')
  findAll(@Query() filterDto: FilterGroupDto) {
    return this.groupsService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: "Bitta guruh haqida ma'lumot olish" })
  @RequirePermissions('groups', 'read')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Guruh ma'lumotlarini tahrirlash" })
  @RequirePermissions('groups', 'update')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupsService.update(+id, updateGroupDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Guruhni arxivlash (Soft delete)' })
  @RequirePermissions('groups', 'delete')
  remove(@Param('id') id: string) {
    return this.groupsService.remove(+id);
  }

  @Post(':id/teachers')
  @ApiOperation({ summary: "Guruhga o'qituvchi biriktirish" })
  @RequirePermissions('groups', 'update')
  assignTeacher(
    @Param('id') id: string,
    @Body() assignTeacherDto: AssignTeacherDto,
  ) {
    return this.groupsService.assignTeacher(+id, assignTeacherDto.teacher_id);
  }

  @Post(':id/students')
  @ApiOperation({ summary: "Guruhga o'quvchi qo'shish" })
  @RequirePermissions('groups', 'update')
  assignStudent(
    @Param('id') id: string,
    @Body() assignStudentDto: AssignStudentDto,
  ) {
    return this.groupsService.assignStudent(+id, assignStudentDto.student_id);
  }
}
