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
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';

@ApiTags('Lessons & Attendance')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @ApiOperation({ summary: "Yangi dars qo'shish" })
  @RequirePermissions('lessons', 'create')
  create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.create(createLessonDto);
  }

  @Get()
  @ApiOperation({ summary: "Guruhning barcha darslarini ko'rish" })
  @ApiQuery({ name: 'groupId', type: Number })
  @RequirePermissions('lessons', 'read')
  findAll(@Query('groupId') groupId: string) {
    return this.lessonsService.findAll(+groupId);
  }

  @Get('by-date')
  @ApiOperation({ summary: "Guruhning ma'lum kundagi darsini ko'rish" })
  @ApiQuery({ name: 'groupId', type: Number })
  @ApiQuery({ name: 'date', type: String })
  @RequirePermissions('lessons', 'read')
  findByDate(@Query('groupId') groupId: string, @Query('date') date: string) {
    return this.lessonsService.findByDate(+groupId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: "Dars haqida ma'lumot (davomat bilan)" })
  @RequirePermissions('lessons', 'read')
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Dars ma'lumotini tahrirlash" })
  @RequirePermissions('lessons', 'update')
  update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @Req() req: any,
  ) {
    return this.lessonsService.update(+id, updateLessonDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Darsni o'chirish" })
  @RequirePermissions('lessons', 'delete')
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(+id);
  }

  @Post(':id/attendance')
  @ApiOperation({ summary: 'Dars uchun davomat kiritish' })
  @RequirePermissions('lessons', 'update')
  submitAttendance(
    @Param('id') id: string,
    @Body() dto: SubmitAttendanceDto,
    @Req() req: any,
  ) {
    return this.lessonsService.submitAttendance(+id, dto, req.user);
  }
}
