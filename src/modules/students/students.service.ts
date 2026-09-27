import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { FilterStudentDto } from './dto/filter-student.dto';
import { PrismaService } from '@/core/database/prisma.service';
import { deleteFile } from '@/common/utils/file-cleanup.util';
import * as argon2 from 'argon2';
import * as fs from 'fs';
import { UserRoles, Prisma } from '@prisma/client';
import { SiteNotificationsService } from '../notifications/site-notifications.service';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: SiteNotificationsService
  ) {}

  async create(createStudentDto: CreateStudentDto, file?: Express.Multer.File) {
    const orConditions: any[] = [{ phone: createStudentDto.phone }];
    if (createStudentDto.email && createStudentDto.email.trim() !== '') {
      orConditions.push({ email: createStudentDto.email.trim() });
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: orConditions,
      },
    });

    if (existingUser) {
      if (file) deleteFile(file.path);
      throw new ConflictException(
        'Bu telefon raqam yoki email allaqachon band!',
      );
    }

    try {
      if (!createStudentDto.password) {
        throw new ConflictException('Parol kiritilishi shart!');
      }
      const hashedPassword = await argon2.hash(createStudentDto.password);

      const student = await this.prisma.user.create({
        data: {
          first_name: createStudentDto.first_name,
          last_name: createStudentDto.last_name,
          phone: createStudentDto.phone,
          email:
            createStudentDto.email && createStudentDto.email.trim() !== ''
              ? createStudentDto.email.trim()
              : null,
          password: hashedPassword,
          address: createStudentDto.address || null,
          birth_date: createStudentDto.birth_date,
          role: UserRoles.STUDENT,
          photo: file ? file.path : null,
        },
      });

      const { password, ...result } = student;
      return result;
    } catch (error: any) {
      if (file) deleteFile(file.path);
      throw error;
    }
  }

  async findAll(filterDto: FilterStudentDto) {
    const { status, search, page = 1, limit = 10 } = filterDto;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.UserWhereInput = {
      role: UserRoles.STUDENT,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, students] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          studentGroups: {
            include: { group: true },
          },
        },
      }),
    ]);

    const formattedStudents = students.map((s) => {
      const { password, ...result } = s;
      return result;
    });

    return {
      data: formattedStudents,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async findOne(id: number) {
    const student = await this.prisma.user.findFirst({
      where: { id, role: UserRoles.STUDENT },
      include: {
        studentGroups: {
          include: { group: true },
        },
      },
    });

    if (!student) throw new NotFoundException("O'quvchi topilmadi");

    const { password, ...result } = student;
    return result;
  }

  async update(
    id: number,
    updateStudentDto: UpdateStudentDto,
    file?: Express.Multer.File,
  ) {
    const student = await this.prisma.user.findFirst({
      where: { id, role: UserRoles.STUDENT },
    });
    if (!student) {
      if (file) deleteFile(file.path);
      throw new NotFoundException("O'quvchi topilmadi");
    }

    let hashedPassword = student.password;
    if (updateStudentDto.password) {
      hashedPassword = await argon2.hash(updateStudentDto.password);
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: {
          ...updateStudentDto,
          password: hashedPassword,
          photo: file ? file.path : student.photo,
        },
      });

      if (file && student.photo) {
        deleteFile(student.photo);
      }

      const { password, ...result } = updated;
      return result;
    } catch (error: any) {
      if (file) deleteFile(file.path);
      throw error;
    }
  }

  async getMyDashboard(studentId: number) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        phone: true,
        email: true,
        photo: true,
      },
    });

    if (!student) {
      throw new NotFoundException("O'quvchi topilmadi");
    }

    const studentGroups = await this.prisma.studentGroup.findMany({
      where: {
        student_id: studentId,
        status: 'active',
        group: {
          status: 'active',
        },
      },
      include: {
        group: {
          include: {
            course: {
              select: { id: true, name: true },
            },
            room: {
              select: { id: true, name: true },
            },
            groupTeachers: {
              include: {
                teacher: {
                  select: { id: true, first_name: true, last_name: true },
                },
              },
            },
          },
        },
      },
    });

    const activeGroups = studentGroups.map((sg) => {
      const g = sg.group;
      const teacher = g.groupTeachers[0]?.teacher;
      return {
        id: g.id,
        name: g.name,
        start_date: g.start_date,
        start_time: g.start_time,
        weekday: g.weekday,
        course_name: g.course?.name,
        room_name: g.room?.name,
        teacher_name: teacher
          ? `${teacher.first_name} ${teacher.last_name}`
          : 'Biriktirilmagan',
      };
    });

    return {
      student,
      activeGroups,
    };
  }

  async getMyGroups(studentId: number) {
    const studentGroups = await this.prisma.studentGroup.findMany({
      where: { student_id: studentId },
      include: {
        group: {
          include: {
            course: { select: { name: true } },
            groupTeachers: {
              include: {
                teacher: {
                  select: { first_name: true, last_name: true, photo: true },
                },
              },
            },
          },
        },
      },
      orderBy: { group: { start_date: 'desc' } },
    });

    return studentGroups.map((sg) => {
      const g = sg.group;
      const teachers = g.groupTeachers.map((gt, index) => ({
        name: `${gt.teacher.first_name} ${gt.teacher.last_name}`,
        photo: gt.teacher.photo,
        role: index === 0 ? "Teacher" : "Assistant"
      }));

      return {
        id: g.id,
        name: g.name,
        course_name: g.course?.name || "Noma'lum",
        status: g.status, // active, inactive, finished
        start_date: g.start_date,
        start_time: g.start_time,
        weekday: g.weekday,
        teachers: teachers
      };
    });
  }

  async getGroupLessons(studentId: number, groupId: number) {
    // Check if student belongs to this group
    const studentGroup = await this.prisma.studentGroup.findUnique({
      where: { student_id_group_id: { student_id: studentId, group_id: groupId } },
      include: { group: { select: { name: true, status: true } } }
    });

    if (!studentGroup) {
      throw new NotFoundException("Siz ushbu guruhga a'zo emassiz");
    }

    const lessons = await this.prisma.lesson.findMany({
      where: { group_id: groupId },
      include: {
        lessonVideos: { select: { id: true, videoUrl: true } },
        homeworks: {
          include: {
            homeworkAnswerStudents: {
              where: { student_id: studentId }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const mappedLessons = lessons.map(lesson => {
      // Find the primary homework for the lesson if exists
      const homework = lesson.homeworks[0];
      let hwStatus = "Berilmagan";
      let hwDeadline: Date | null = null;
      let hwGrade: number | null = null;
      let answerId: number | null = null;

      if (homework) {
        hwDeadline = homework.deadline;
        const answer = homework.homeworkAnswerStudents[0];
        if (answer) {
          hwStatus = answer.status; // PENDING, CHECKED, REJECTED
          hwGrade = answer.grade;
          answerId = answer.id;
        } else {
          hwStatus = "Berilgan"; // Not submitted
        }
      }

      return {
        id: lesson.id,
        topic: lesson.topic,
        date: lesson.createdAt,
        videoCount: lesson.lessonVideos.length,
        videos: lesson.lessonVideos,
        homework: {
          id: homework ? homework.id : null,
          status: hwStatus,
          deadline: hwDeadline,
          grade: hwGrade,
          answerId: answerId
        }
      };
    });

    const exams = await this.prisma.exam.findMany({
      where: { group_id: groupId },
      include: {
        examResults: {
          where: { student_id: studentId }
        }
      },
      orderBy: { date: 'asc' }
    });

    const mappedExams = exams.map(exam => {
      const result = exam.examResults[0];
      return {
        id: exam.id,
        topic: exam.topic,
        date: exam.date,
        maxScore: exam.maxScore,
        minScore: exam.minScore,
        status: result ? result.status : "Berilgan",
        score: result ? result.score : null,
      };
    });

    return {
      group: {
        name: studentGroup.group.name,
        status: studentGroup.group.status
      },
      lessons: mappedLessons,
      exams: mappedExams
    };
  }

  async getLessonDetails(studentId: number, lessonId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: { select: { id: true, name: true, status: true } },
        lessonVideos: true,
        homeworks: {
          include: {
            homeworkAnswerStudents: {
              where: { student_id: studentId },
              include: { gradedBy: { select: { first_name: true, last_name: true } } }
            }
          }
        }
      }
    });

    if (!lesson) {
      throw new NotFoundException("Dars topilmadi");
    }

    // Verify student is in this group
    const studentGroup = await this.prisma.studentGroup.findUnique({
      where: { student_id_group_id: { student_id: studentId, group_id: lesson.group_id } }
    });

    if (!studentGroup) {
      throw new NotFoundException("Ushbu darsga kirish huquqingiz yo'q");
    }

    // Fetch all group lessons for the sidebar
    const allGroupLessons = await this.prisma.lesson.findMany({
      where: { group_id: lesson.group_id },
      select: { id: true, topic: true, date: true },
      orderBy: { createdAt: 'asc' }
    });

    return {
      lesson,
      groupLessons: allGroupLessons
    };
  }

  async submitHomework(studentId: number, homeworkId: number, payload: { title: string; file?: string }) {
    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
      include: { 
        lesson: { 
          include: { 
            group: {
              include: { groupTeachers: true }
            }
          }
        } 
      }
    });

    if (!homework) {
      throw new NotFoundException("Uy vazifasi topilmadi");
    }

    // Check if the student belongs to the group of this lesson
    const studentGroup = await this.prisma.studentGroup.findUnique({
      where: { student_id_group_id: { student_id: studentId, group_id: homework.lesson.group_id } }
    });

    if (!studentGroup) {
      throw new BadRequestException("Ushbu darsga kirish huquqingiz yo'q");
    }

    // Check deadline
    if (homework.deadline && new Date(homework.deadline).getTime() < new Date().getTime()) {
      throw new BadRequestException("Vazifa muddati o'tib ketgan");
    }

    // Upsert the submission
    // Since there is no unique constraint on (student_id, homework_id) in schema, we will findFirst and then update or create
    const existingSubmission = await this.prisma.homeworkAnswerStudent.findFirst({
      where: { student_id: studentId, homework_id: homeworkId }
    });

    let submission;
    if (existingSubmission) {
      submission = await this.prisma.homeworkAnswerStudent.update({
        where: { id: existingSubmission.id },
        data: {
          title: payload.title,
          file: payload.file,
          status: 'PENDING',
          updatedAt: new Date()
        }
      });
    } else {
      submission = await this.prisma.homeworkAnswerStudent.create({
        data: {
          student_id: studentId,
          homework_id: homeworkId,
          title: payload.title,
          file: payload.file,
          status: 'PENDING'
        }
      });
    }

    // Notify teachers
    const studentInfo = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (studentInfo && homework.lesson.group.groupTeachers) {
      for (const gt of homework.lesson.group.groupTeachers) {
        await this.notifications.createNotification(
          gt.teacher_id,
          "Yangi vazifa topshirildi!",
          `${studentInfo.first_name} ${studentInfo.last_name} "${homework.title}" vazifasini topshirdi.`
        );
      }
    }

    return submission;
  }

  async remove(id: number) {
    const student = await this.prisma.user.findFirst({
      where: { id, role: UserRoles.STUDENT },
    });
    if (!student) throw new NotFoundException("O'quvchi topilmadi");

    // Soft delete qilinadi (status o'zgaradi)
    await this.prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return { message: "O'quvchi muvaffaqiyatli arxivlandi (Soft Delete)" };
  }
}
