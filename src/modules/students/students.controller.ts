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
