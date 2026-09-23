import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { LessonVideosService } from './lesson-videos.service';
import { CreateLessonVideoDto } from './dto/create-lesson-video.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { getMulterOptions } from '@/common/utils/file-upload.util';

@ApiTags('Lesson Videos')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('lesson-videos')
export class LessonVideosController {
  constructor(private readonly lessonVideosService: LessonVideosService) {}

  @Post()
  @ApiOperation({ summary: 'Dars videosini yuklash (max 2GB)' })
  @ApiConsumes('multipart/form-data')
  @RequirePermissions('lesson_videos', 'create')
  @UseInterceptors(
    FileInterceptor('file', getMulterOptions('lesson_videos', 'video')),
  )
  create(
    @Body() dto: CreateLessonVideoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.lessonVideosService.create(dto, file);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Bitta darsga tegishli videolarni olish' })
  @RequirePermissions('lesson_videos', 'read')
  findAllByLesson(@Param('lessonId') lessonId: string) {
    return this.lessonVideosService.findAllByLesson(+lessonId);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Dars videosini o'chirish (fayl bilan birga)" })
  @RequirePermissions('lesson_videos', 'delete')
  remove(@Param('id') id: string) {
    return this.lessonVideosService.remove(+id);
  }
}
