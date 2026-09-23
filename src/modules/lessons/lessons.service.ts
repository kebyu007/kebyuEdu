import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';
import { PrismaService } from '@/core/database/prisma.service';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async create(createLessonDto: CreateLessonDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: createLessonDto.group_id },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi!');

    // Check if lesson already exists for this date
    const existing = await this.prisma.lesson.findFirst({
      where: {
        group_id: createLessonDto.group_id,
        date: createLessonDto.date,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ushbu kun uchun guruhda dars allaqachon yaratilgan!',
      );
    }

    return await this.prisma.lesson.create({
      data: {
        group_id: createLessonDto.group_id,
        teacher_id: createLessonDto.teacher_id,
        topic: createLessonDto.topic,
        description: createLessonDto.description || '',
        date: createLessonDto.date,
      },
    });
  }

  async findByDate(groupId: number, date: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { group_id: groupId, date },
      include: {
        attendances: {
          include: {
            student: {
              select: { id: true, first_name: true, last_name: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      return null;
    }
    return lesson;
  }

  async findAll(groupId: number) {
    return await this.prisma.lesson.findMany({
      where: { group_id: groupId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { attendances: true, homeworks: true } },
      },
    });
  }

  async findOne(id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        attendances: {
          include: {
            student: {
              select: { id: true, first_name: true, last_name: true },
            },
          },
        },
        homeworks: true,
      },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi!');
    return lesson;
  }

  async update(id: number, updateLessonDto: UpdateLessonDto, user: any) {
    const lesson = await this.findOne(id);

    // Check if attendance already exists and user is teacher
    if (
      user?.role === 'TEACHER' &&
      lesson.attendances &&
      lesson.attendances.length > 0
    ) {
      throw new ForbiddenException(
        "Dars elon qilingan va davomat kiritilgan. O'zgartirish mumkin emas!",
      );
    }

    return await this.prisma.lesson.update({
      where: { id },
      data: updateLessonDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.lesson.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }

  async submitAttendance(
    lessonId: number,
    dto: SubmitAttendanceDto,
    user: any,
  ) {
    const lesson = await this.findOne(lessonId);

    // If attendance already exists and user is teacher, block
    if (
      user?.role === 'TEACHER' &&
      lesson.attendances &&
      lesson.attendances.length > 0
    ) {
      throw new ForbiddenException(
        "Davomat allaqachon kiritilgan. O'zgartirish mumkin emas!",
      );
    }

    const studentIds = dto.attendances.map((a) => a.student_id);
    const validStudents = await this.prisma.studentGroup.findMany({
      where: { group_id: lesson.group_id, student_id: { in: studentIds } },
    });

    if (validStudents.length !== studentIds.length) {
      throw new BadRequestException(
        "Ba'zi o'quvchilar bu guruhga tegishli emas!",
      );
    }

    try {
      await this.prisma.attendance.deleteMany({
        where: { lesson_id: lessonId },
      });

      await this.prisma.attendance.createMany({
        data: dto.attendances.map((a) => ({
          lesson_id: lessonId,
          student_id: a.student_id,
          isPresent: a.isPresent,
          marked_by_id: user.id,
        })),
      });
      return { success: true };
    } catch (error) {
      throw new ConflictException('Davomat kiritishda xatolik yuz berdi!');
    }
  }
}
