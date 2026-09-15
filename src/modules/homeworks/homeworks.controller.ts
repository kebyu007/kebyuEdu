import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { HomeworksService } from './homeworks.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { GradeHomeworkDto } from './dto/grade-homework.dto';
import { SubmitHomeworkAnswerDto } from './dto/submit-homework-answer.dto';
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

@ApiTags('Homeworks')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('homeworks')
export class HomeworksController {
  constructor(private readonly homeworksService: HomeworksService) {}

  @Post()
  @ApiOperation({ summary: "Yangi uy vazifasi yaratish (O'qituvchi uchun)" })
  @ApiConsumes('multipart/form-data')
  @RequirePermissions('homeworks', 'create')
  @UseInterceptors(
    FileInterceptor('file', getMulterOptions('homeworks', 'document')),
  )
  createHomework(
    @Body() createHomeworkDto: CreateHomeworkDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const teacherId = req.user.id;
    return this.homeworksService.createHomework(
      teacherId,
      createHomeworkDto,
      file,
    );
  }

  @Post('submit')
  @ApiOperation({ summary: "Uy vazifasiga javob yuborish (O'quvchi uchun)" })
  @ApiConsumes('multipart/form-data')
  @RequirePermissions('homeworks', 'create')
  @UseInterceptors(
    FileInterceptor('file', getMulterOptions('homeworks', 'document')),
  )
  submitAnswer(
    @Body() submitDto: SubmitHomeworkAnswerDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const studentId = req.user.id;
    return this.homeworksService.submitAnswer(studentId, submitDto, file);
  }

  @Patch('answers/:id/grade')
  @ApiOperation({ summary: "O'quvchi javobini baholash (O'qituvchi uchun)" })
  @RequirePermissions('homeworks', 'update')
  gradeAnswer(
    @Param('id') id: string,
    @Body() gradeDto: GradeHomeworkDto,
    @Req() req: any,
  ) {
    const teacherId = req.user.id;
    return this.homeworksService.gradeAnswer(+id, teacherId, gradeDto);
  }
}
