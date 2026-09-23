import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, Get, Param, Patch, Req, Delete } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { getMulterOptions } from '@/common/utils/file-upload.util';

@ApiTags('Exams')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @ApiOperation({ summary: 'Yangi imtihon yaratish' })
  @ApiConsumes('multipart/form-data')
  @RequirePermissions('exams', 'create')
  @UseInterceptors(
    FileInterceptor('file', getMulterOptions('exams', 'document')),
  )
  create(
    @Body() createExamDto: CreateExamDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.examsService.create(createExamDto, file);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Imtihon ma`lumotlarini olish' })
  getExam(@Param('id') id: string) {
    return this.examsService.getExam(+id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Imtihonga javob yuborish' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', getMulterOptions('exams', 'document')),
  )
  submitAnswer(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: import('./dto/submit-exam-answer.dto').SubmitExamAnswerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.examsService.submitAnswer(req.user, +id, dto, file);
  }

  @Patch('results/:resultId/grade')
  @ApiOperation({ summary: 'Imtihon javobini baholash' })
  @RequirePermissions('exams', 'update')
  gradeAnswer(
    @Param('resultId') resultId: string,
    @Body() dto: import('./dto/grade-exam.dto').GradeExamDto,
  ) {
    return this.examsService.gradeAnswer(+resultId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Imtihonni o`chirish' })
  @RequirePermissions('exams', 'delete')
  deleteExam(@Param('id') id: string) {
    return this.examsService.deleteExam(+id);
  }
}
