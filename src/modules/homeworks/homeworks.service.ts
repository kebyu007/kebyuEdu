import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { GradeHomeworkDto } from './dto/grade-homework.dto';
import { SubmitHomeworkAnswerDto } from './dto/submit-homework-answer.dto';
import { PrismaService } from '@/core/database/prisma.service';
import { deleteFile } from '@/common/utils/file-cleanup.util';

@Injectable()
export class HomeworksService {
  constructor(private prisma: PrismaService) {}

  async createHomework(
    teacherId: number,
    createHomeworkDto: CreateHomeworkDto,
    file?: Express.Multer.File,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: createHomeworkDto.lesson_id },
    });
    if (!lesson) {
      if (file) deleteFile(file.path);
      throw new NotFoundException('Dars topilmadi!');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { file: _discard, ...data } = createHomeworkDto as any;

    try {
      return await this.prisma.homework.create({
        data: {
          ...data,
          teacher_id: teacherId,
          file: file ? file.path : null,
        },
      });
    } catch (error: any) {
      if (file) deleteFile(file.path);
      throw error;
    }
  }

  async submitAnswer(
    studentId: number,
    submitDto: SubmitHomeworkAnswerDto,
    file?: Express.Multer.File,
  ) {
    const homework = await this.prisma.homework.findUnique({
      where: { id: submitDto.homework_id },
      include: { lesson: true },
    });

    if (!homework) {
      if (file) deleteFile(file.path);
      throw new NotFoundException('Uy vazifasi topilmadi!');
    }

    const studentGroup = await this.prisma.studentGroup.findUnique({
      where: {
        student_id_group_id: {
          student_id: studentId,
          group_id: homework.lesson.group_id,
        },
      },
    });

    if (!studentGroup) {
      if (file) deleteFile(file.path);
      throw new ForbiddenException(
        "Siz bu guruhga a'zo emassiz, vazifa yubora olmaysiz!",
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { file: _discard, ...data } = submitDto as any;

    try {
      return await this.prisma.homeworkAnswerStudent.create({
        data: {
          ...data,
          student_id: studentId,
          file: file ? file.path : null,
        },
      });
    } catch (error: any) {
      if (file) deleteFile(file.path);
      throw error;
    }
  }

  async gradeAnswer(
    answerId: number,
    teacherId: number,
    dto: GradeHomeworkDto,
  ) {
    const answer = await this.prisma.homeworkAnswerStudent.findUnique({
      where: { id: answerId },
    });
    if (!answer) throw new NotFoundException('Javob topilmadi!');

    return await this.prisma.homeworkAnswerStudent.update({
      where: { id: answerId },
      data: {
        grade: dto.grade,
        status: dto.status,
        graded_by_id: teacherId,
      },
    });
  }
}
