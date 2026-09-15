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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { getMulterOptions } from '@/common/utils/file-upload.util';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { FilterCourseDto } from './dto/filter-course.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @ApiOperation({ summary: "Yangi kurs qo'shish" })
  @ApiConsumes('multipart/form-data')
  @RequirePermissions('courses', 'create')
  @UseInterceptors(FileInterceptor('photo', getMulterOptions('courses')))
  create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.coursesService.create(createCourseDto, file);
  }

  @Get()
  @ApiOperation({ summary: "Barcha kurslarni ro'yxatini olish" })
  @RequirePermissions('courses', 'read')
  findAll(@Query() filterDto: FilterCourseDto) {
    return this.coursesService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: "Bitta kurs haqida ma'lumot olish" })
  @RequirePermissions('courses', 'read')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Kurs ma'lumotlarini tahrirlash" })
  @ApiConsumes('multipart/form-data')
  @RequirePermissions('courses', 'update')
  @UseInterceptors(FileInterceptor('photo', getMulterOptions('courses')))
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.coursesService.update(+id, updateCourseDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Kursni arxivlash (Soft delete)' })
  @RequirePermissions('courses', 'delete')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(+id);
  }
}
