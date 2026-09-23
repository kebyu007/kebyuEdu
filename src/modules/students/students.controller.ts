import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { FilterStudentDto } from './dto/filter-student.dto';
import { getMulterOptions } from '@/common/utils/file-upload.util';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';

@ApiTags('Students')
@Controller('students')
@UseGuards(PermissionsGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @RequirePermissions('students', 'create')
  @UseInterceptors(
    FileInterceptor('photo', getMulterOptions('profile_pictures')),
  )
  @ApiOperation({ summary: "Yangi o'quvchi yaratish" })
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createStudentDto: CreateStudentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentsService.create(createStudentDto, file);
  }

  @Get('me/dashboard')
  @ApiOperation({
    summary:
      "O'quvchining shaxsiy paneli ma'lumotlarini olish (Dars jadvali va guruhlar)",
  })
  getMyDashboard(@Request() req) {
    return this.studentsService.getMyDashboard(req.user.id);
  }

  @Get('me/groups')
  @ApiOperation({
    summary: "O'quvchining barcha guruhlarini olish (faol va tugagan)",
  })
  getMyGroups(@Request() req) {
    return this.studentsService.getMyGroups(req.user.id);
  }

  @Get('me/groups/:id/lessons')
  @ApiOperation({ summary: "Guruhning darslari va uy vazifalarini olish" })
  getGroupLessons(@Request() req, @Param('id') groupId: string) {
    return this.studentsService.getGroupLessons(req.user.id, +groupId);
  }

  @Get('me/lessons/:id')
  @ApiOperation({ summary: "Darsning to'liq tafsilotlarini olish" })
  getLessonDetails(@Request() req, @Param('id') lessonId: string) {
    return this.studentsService.getLessonDetails(req.user.id, +lessonId);
  }

  @Post('me/homeworks/:id/submit')
  @UseInterceptors(FileInterceptor('file', getMulterOptions('homework_answers', 'document')))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: "Uy vazifasini topshirish (faqat zip fayl orqali ixtiyoriy yuklash)" })
  submitHomework(
    @Request() req, 
    @Param('id') homeworkId: string, 
    @Body() payload: { title: string },
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (file && !file.originalname.toLowerCase().endsWith('.zip')) {
      // Import BadRequestException inline to avoid changing imports at top if it's missing
      const { BadRequestException } = require('@nestjs/common');
      throw new BadRequestException("Faqatgina .zip fayllar qabul qilinadi!");
    }
    
    const finalPayload = {
      title: payload.title,
      file: file ? `uploads/homework_answers/${file.filename}` : undefined
    };

    return this.studentsService.submitHomework(req.user.id, +homeworkId, finalPayload);
  }

  @Get()
  @RequirePermissions('students', 'read')
  @ApiOperation({ summary: "Barcha o'quvchilarni olish (filtrlash bilan)" })
  findAll(@Query() filterDto: FilterStudentDto) {
    return this.studentsService.findAll(filterDto);
  }

  @Get(':id')
  @RequirePermissions('students', 'read')
  @ApiOperation({ summary: "Bitta o'quvchi ma'lumotlarini ID orqali olish" })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermissions('students', 'update')
  @UseInterceptors(
    FileInterceptor('photo', getMulterOptions('profile_pictures')),
  )
  @ApiOperation({ summary: "O'quvchi ma'lumotlarini o'zgartirish" })
  @ApiConsumes('multipart/form-data')
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentsService.update(+id, updateStudentDto, file);
  }

  @Delete(':id')
  @RequirePermissions('students', 'delete')
  @ApiOperation({ summary: "O'quvchini bazadan o'chirish" })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(+id);
  }
}
