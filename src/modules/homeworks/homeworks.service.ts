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
    user: any,
    createHomeworkDto: CreateHomeworkDto,
    file?: Express.Multer.File,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: createHomeworkDto.lesson_id },
      include: { homeworks: true },
    });
    if (!lesson) {
      if (file) deleteFile(file.path);
      throw new NotFoundException('Dars topilmadi!');
    }

    if (
      user?.role === 'TEACHER' &&
      lesson.homeworks &&
      lesson.homeworks.length >= 1
    ) {
      if (file) deleteFile(file.path);
      throw new ForbiddenException(
        'Bitta dars uchun faqat 1 ta uy vazifasi berish mumkin!',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { file: _discard, ...data } = createHomeworkDto as any;

    try {
      const deadlineHours = Number(process.env.HOMEWORK_DEADLINE_HOURS || 24);
      const deadlineDate = new Date(
        Date.now() + deadlineHours * 60 * 60 * 1000,
      );

      return await this.prisma.homework.create({
        data: {
          ...data,
          teacher_id: user.id,
          file: file ? file.path : null,
          deadline: deadlineDate,
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

  async getHomeworkResults(id: number) {
    const homework = await this.prisma.homework.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            group: {
              include: {
                studentGroups: {
                  include: {
                    student: true,
                  },
                },
              },
            },
          },
        },
        homeworkAnswerStudents: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!homework) throw new NotFoundException('Uy vazifasi topilmadi!');

    const groupStudents = homework.lesson.group.studentGroups.map(
      (sg) => sg.student,
    );
    const answers = homework.homeworkAnswerStudents;

    const notSubmitted: any[] = [];
    const pending: any[] = [];
    const checked: any[] = [];
    const rejected: any[] = [];

    groupStudents.forEach((student) => {
      const answer = answers.find((a) => a.student_id === student.id);

      const studentData = {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        avatar: student.photo,
        submitDate: answer ? answer.createdAt : null,
        status: answer ? answer.status : 'NOT_SUBMITTED',
        answerId: answer ? answer.id : null,
        file: answer ? answer.file : null,
        title: answer ? answer.title : null,
        grade: answer ? answer.grade : null,
      };

      if (!answer) {
        notSubmitted.push(studentData);
      } else if (answer.status === 'PENDING') {
        pending.push(studentData);
      } else if (answer.status === 'CHECKED') {
        checked.push(studentData);
      } else if (answer.status === 'REJECTED') {
        rejected.push(studentData);
      }
    });

    return {
      id: homework.id,
      title: homework.title,
      dueDate:
        homework.deadline ||
        new Date(
          homework.createdAt.getTime() +
            Number(process.env.HOMEWORK_DEADLINE_HOURS || 24) * 60 * 60 * 1000,
        ),
      stats: {
        notSubmitted: notSubmitted.length,
        pending: pending.length,
        checked: checked.length,
        rejected: rejected.length,
      },
      results: {
        notSubmitted,
        pending,
        checked,
        rejected,
      },
    };
  }
}
