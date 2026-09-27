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
import { SiteNotificationsService } from '../notifications/site-notifications.service';

@Injectable()
export class HomeworksService {
  constructor(
    private prisma: PrismaService,
    private notifications: SiteNotificationsService,
  ) {}

  async createHomework(
    user: any,
    createHomeworkDto: CreateHomeworkDto,
    file?: Express.Multer.File,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: createHomeworkDto.lesson_id },
      include: { 
        homeworks: true,
        group: {
          include: { studentGroups: true }
        }
      },
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

      const created = await this.prisma.homework.create({
        data: {
          ...data,
          teacher_id: user.id,
          file: file ? file.path : null,
          deadline: deadlineDate,
        },
      });

      // Barcha o'quvchilarga xabarnoma yuborish
      if (lesson.group?.studentGroups) {
        for (const sg of lesson.group.studentGroups) {
          await this.notifications.createNotification(
            sg.student_id,
            "Yangi uy vazifasi!",
            `${created.title} vazifasi berildi.`
          );
        }
      }

      return created;
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
      const created = await this.prisma.homeworkAnswerStudent.create({
        data: {
          ...data,
          student_id: studentId,
          file: file ? file.path : null,
        },
      });

      // O'qituvchiga xabar berish
      if (homework.teacher_id) {
        await this.notifications.createNotification(
          homework.teacher_id,
          "Vazifa topshirildi!",
          `O'quvchi uy vazifasini topshirdi. Uni tekshirishingiz mumkin.`
        );
      }

      return created;
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

    const updated = await this.prisma.homeworkAnswerStudent.update({
      where: { id: answerId },
      data: {
        grade: dto.grade,
        status: dto.status,
        graded_by_id: teacherId,
      },
    });

    // O'quvchiga baho yoki tekshiruv natijasi haqida xabar berish
    await this.notifications.createNotification(
      answer.student_id,
      "Vazifa tekshirildi",
      `Sizning uy vazifangiz tekshirildi. Natija: ${dto.status}`
    );

    return updated;
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

  async updateHomework(id: number, dto: any) {
    const homework = await this.prisma.homework.findUnique({ where: { id } });
    if (!homework) throw new NotFoundException('Uy vazifasi topilmadi!');

    return await this.prisma.homework.update({
      where: { id },
      data: { title: dto.title },
    });
  }

  async deleteHomework(id: number) {
    const homework = await this.prisma.homework.findUnique({
      where: { id },
      include: { homeworkAnswerStudents: true },
    });

    if (!homework) throw new NotFoundException('Uy vazifasi topilmadi!');

    // First delete all answer records and their files
    for (const answer of homework.homeworkAnswerStudents) {
      if (answer.file) {
        deleteFile(answer.file);
      }
    }

    await this.prisma.homeworkAnswerStudent.deleteMany({
      where: { homework_id: id },
    });

    // Then delete the main homework file if it exists
    if (homework.file) {
      deleteFile(homework.file);
    }

    // Finally delete the homework record
    await this.prisma.homework.delete({
      where: { id },
    });

    return { message: "Uy vazifasi muvaffaqiyatli o'chirildi" };
  }
}
