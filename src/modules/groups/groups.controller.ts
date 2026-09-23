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
  Req,
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
  findAll(@Query() filterDto: FilterGroupDto, @Req() req: any) {
    if (req.user && req.user.role === 'TEACHER') {
      filterDto.teacher_id = req.user.id;
    }
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

  @Get(':id/homeworks')
  @ApiOperation({ summary: 'Guruhga tegishli barcha uyga vazifalarni olish' })
  @RequirePermissions('groups', 'read')
  getGroupHomeworks(@Param('id') id: string) {
    return this.groupsService.getGroupHomeworks(+id);
  }

  @Get(':id/lesson-videos')
  @ApiOperation({ summary: 'Guruhga tegishli barcha video darsliklarni olish' })
  @RequirePermissions('groups', 'read')
  getGroupLessonVideos(@Param('id') id: string) {
    return this.groupsService.getGroupLessonVideos(+id);
  }

  @Get(':id/exams')
  @ApiOperation({ summary: 'Guruhga tegishli barcha imtihonlarni olish' })
  @RequirePermissions('groups', 'read')
  getGroupExams(@Param('id') id: string) {
    return this.groupsService.getGroupExams(+id);
  }

  @Get(':id/statistics')
  @ApiOperation({
    summary: "Guruhning umumiy statistikasini olish (davomat, o'zlashtirish)",
  })
  @RequirePermissions('groups', 'read')
  getGroupStatistics(@Param('id') id: string) {
    return this.groupsService.getGroupStatistics(+id);
  }

  @Get(':id/journal')
  @ApiOperation({ summary: "Guruh jurnali (baholar ro'yxati)" })
  @RequirePermissions('groups', 'read')
  getGroupJournal(@Param('id') id: string) {
    return this.groupsService.getGroupJournal(+id);
  }

  @Get(':id/attendance')
  @ApiOperation({ summary: 'Guruh akademik davomati' })
  @RequirePermissions('groups', 'read')
  getGroupAttendance(@Param('id') id: string) {
    return this.groupsService.getGroupAttendance(+id);
  }

  @Post(':id/attendance')
  @ApiOperation({ summary: "Guruh davomatini saqlash" })
  @RequirePermissions('groups', 'update')
  saveGroupAttendance(
    @Param('id') id: string,
    @Body() dto: import('./dto/save-attendance.dto').SaveAttendanceDto,
    @Req() req: any,
  ) {
    return this.groupsService.saveGroupAttendance(+id, req.user.id, dto);
  }
}
