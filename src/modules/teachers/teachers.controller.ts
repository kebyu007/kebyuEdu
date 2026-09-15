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
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { FilterTeacherDto } from './dto/filter-teacher.dto';
import { getMulterOptions } from '@/common/utils/file-upload.util';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';

@ApiTags('Teachers')
@Controller('teachers')
@UseGuards(PermissionsGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @RequirePermissions('teachers', 'create')
  @UseInterceptors(
    FileInterceptor('photo', getMulterOptions('profile_pictures')),
  )
  @ApiOperation({ summary: "Yangi o'qituvchi yaratish" })
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createTeacherDto: CreateTeacherDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.teachersService.create(createTeacherDto, file);
  }

  @Get()
  @RequirePermissions('teachers', 'read')
  @ApiOperation({ summary: "Barcha o'qituvchilarni olish (filtrlash bilan)" })
  findAll(@Query() filterDto: FilterTeacherDto) {
    return this.teachersService.findAll(filterDto);
  }

  @Get(':id')
  @RequirePermissions('teachers', 'read')
  @ApiOperation({ summary: "Bitta o'qituvchi ma'lumotlarini ID orqali olish" })
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermissions('teachers', 'update')
  @UseInterceptors(
    FileInterceptor('photo', getMulterOptions('profile_pictures')),
  )
  @ApiOperation({ summary: "O'qituvchi ma'lumotlarini o'zgartirish" })
  @ApiConsumes('multipart/form-data')
  update(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.teachersService.update(+id, updateTeacherDto, file);
  }

  @Delete(':id')
  @RequirePermissions('teachers', 'delete')
  @ApiOperation({ summary: "O'qituvchini bazadan o'chirish" })
  remove(@Param('id') id: string) {
    return this.teachersService.remove(+id);
  }
}
