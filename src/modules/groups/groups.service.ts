import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { FilterGroupDto } from './dto/filter-group.dto';
import { PrismaService } from '@/core/database/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(createGroupDto: CreateGroupDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: createGroupDto.room_id },
    });
    if (!room) throw new NotFoundException('Xona topilmadi!');
    if (createGroupDto.max_student > room.capacity) {
      throw new BadRequestException(
        `Guruh sig'imi xona sig'imidan (${room.capacity}) oshib ketmasligi kerak!`,
      );
    }

    const course = await this.prisma.course.findUnique({
      where: { id: createGroupDto.course_id },
    });
    if (!course) throw new NotFoundException('Kurs topilmadi!');

    // Check room time overlap
    const overlappingGroup = await this.prisma.group.findFirst({
      where: {
        room_id: createGroupDto.room_id,
        start_time: createGroupDto.start_time,
        weekday: {
          hasSome: createGroupDto.weekday,
        },
        status: 'active',
      },
    });
    if (overlappingGroup) {
      throw new ConflictException(
        `Ushbu vaqtda xonada "${overlappingGroup.name}" guruhi dars o'tmoqda! Boshqa vaqt yoki xona tanlang.`,
      );
    }

    try {
      return await this.prisma.group.create({
        data: createGroupDto,
      });
    } catch (error: any) {
      throw error;
    }
  }

  async findAll(filterDto: FilterGroupDto) {
    const { search, status, page = 1, limit = 10, teacher_id } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (teacher_id) {
      where.groupTeachers = {
        some: {
          teacher_id: teacher_id,
        },
      };
    }

    const [groups, total] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              duration_month: true,
              duration_hours: true,
            },
          },
          room: { select: { id: true, name: true, capacity: true } },
          groupTeachers: {
            include: {
              teacher: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  photo: true,
                },
              },
            },
          },
          studentGroups: {
            include: {
              student: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  photo: true,
                  phone: true,
                },
              },
            },
          },
          _count: {
            select: { studentGroups: true, groupTeachers: true },
          },
        },
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      data: groups,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        course: true,
        room: true,
        groupTeachers: {
          include: {
            teacher: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                photo: true,
                phone: true,
              },
            },
          },
        },
        studentGroups: {
          include: {
            student: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                photo: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Guruh topilmadi!');
    }
    return group;
  }

  async update(id: number, updateGroupDto: UpdateGroupDto) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) {
      throw new NotFoundException('Guruh topilmadi!');
    }

    const roomId = updateGroupDto.room_id || group.room_id;
    const maxStudent = updateGroupDto.max_student || group.max_student;

    if (updateGroupDto.room_id || updateGroupDto.max_student) {
      const room = await this.prisma.room.findUnique({ where: { id: roomId } });
      if (!room) throw new NotFoundException('Xona topilmadi!');
      if (maxStudent > room.capacity) {
        throw new BadRequestException(
          `Guruh sig'imi xona sig'imidan (${room.capacity}) oshib ketmasligi kerak!`,
        );
      }
    }

    // Check room time overlap if room, time, or weekday is changing
    if (
      updateGroupDto.room_id ||
      updateGroupDto.start_time ||
      updateGroupDto.weekday
    ) {
      const checkRoomId = updateGroupDto.room_id || group.room_id;
      const checkTime = updateGroupDto.start_time || group.start_time;
      const checkWeekday = updateGroupDto.weekday || group.weekday;

      const overlappingGroup = await this.prisma.group.findFirst({
        where: {
          id: { not: id },
          room_id: checkRoomId,
          start_time: checkTime,
          weekday: {
            hasSome: checkWeekday,
          },
          status: 'active',
        },
      });
      if (overlappingGroup) {
        throw new ConflictException(
          `Ushbu vaqtda xonada "${overlappingGroup.name}" guruhi dars o'tmoqda! Boshqa vaqt yoki xona tanlang.`,
        );
      }
    }

    try {
      return await this.prisma.group.update({
        where: { id },
        data: updateGroupDto,
      });
    } catch (error: any) {
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    return await this.prisma.group.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }

  async assignTeacher(groupId: number, teacherId: number) {
    const group = await this.findOne(groupId);
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });
    if (!teacher || teacher.role !== 'TEACHER') {
      throw new NotFoundException(
        "O'qituvchi topilmadi yoki bu foydalanuvchi o'qituvchi emas!",
      );
    }

    try {
      return await this.prisma.groupTeacher.create({
        data: {
          group_id: groupId,
          teacher_id: teacherId,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          "Ushbu o'qituvchi guruhga avval qo'shilgan!",
        );
      }
      throw error;
    }
  }

  async assignStudent(groupId: number, studentId: number) {
    const group = await this.findOne(groupId);
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!student || student.role !== 'STUDENT') {
      throw new NotFoundException(
        "O'quvchi topilmadi yoki bu foydalanuvchi o'quvchi emas!",
      );
    }

    // Avval ushbu o'quvchi bu guruhda bor-yo'qligini tekshiramiz
    const existing = await this.prisma.studentGroup.findUnique({
      where: {
        student_id_group_id: { student_id: studentId, group_id: groupId },
      },
    });

    if (existing) {
      if (existing.status === 'active') {
        // Agar allaqachon guruhda faol bo'lsa, xato bermaymiz.
        // Frontend shunchaki qayta-qayta yuborgan bo'lishi mumkin.
        return existing;
      } else {
        // Agar guruhdan chiqarilgan bo'lsa va qayta qo'shilayotgan bo'lsa, bo'sh joyni tekshiramiz
        const currentStudentsCount = await this.prisma.studentGroup.count({
          where: { group_id: groupId, status: 'active' },
        });

        if (currentStudentsCount >= group.max_student) {
          throw new BadRequestException(
            "Guruh to'lgan! Ushbu o'quvchini qayta faollashtirib bo'lmaydi.",
          );
        }

        return await this.prisma.studentGroup.update({
          where: { id: existing.id },
          data: { status: 'active' },
        });
      }
    }

    // Agar o'quvchi mutlaqo yangi bo'lsa
    const currentStudentsCount = await this.prisma.studentGroup.count({
      where: { group_id: groupId, status: 'active' },
    });

    if (currentStudentsCount >= group.max_student) {
      throw new BadRequestException(
        "Guruh to'lgan! Boshqa o'quvchi qo'shib bo'lmaydi.",
      );
    }

    try {
      return await this.prisma.studentGroup.create({
        data: {
          group_id: groupId,
          student_id: studentId,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException("Ushbu o'quvchi guruhga avval qo'shilgan!");
      }
      throw error;
    }
  }

  async getGroupHomeworks(id: number) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        studentGroups: true,
        lessons: {
          include: {
            homeworks: {
              include: {
                homeworkAnswerStudents: true,
              },
            },
          },
        },
      },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi!');

    // Flatten homeworks from lessons
    const homeworks = group.lessons.flatMap((lesson) =>
      lesson.homeworks.map((hw) => ({
        id: hw.id,
        topic: hw.title,
        users: group.studentGroups.length,
        clock: hw.homeworkAnswerStudents.filter((a) => a.status === 'PENDING').length,
        check: hw.homeworkAnswerStudents.filter((a) => a.status === 'CHECKED').length,
        assignedTime: hw.createdAt,
        endTime:
          hw.deadline ||
          new Date(
            hw.createdAt.getTime() +
              Number(process.env.HOMEWORK_DEADLINE_HOURS || 24) *
                60 *
                60 *
                1000,
          ),
        date: hw.createdAt,
      })),
    );

    return homeworks;
  }

  async getGroupLessonVideos(id: number) {
    const videos = await this.prisma.lessonVideo.findMany({
      where: { group_id: id },
      include: {
        lesson: {
          select: { topic: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return videos.map((video) => ({
      id: video.id,
      name: video.originalName,
      lesson: video.lesson.topic,
      status: 'Tayyor',
      date: video.createdAt,
      size: `${video.size_mb} MB`,
      added: video.createdAt,
      url: video.videoUrl,
    }));
  }

  async getGroupExams(id: number) {
    const exams = await this.prisma.exam.findMany({
      where: { group_id: id },
      include: {
        examResults: {
          include: {
            student: {
              select: { id: true, first_name: true, last_name: true },
            },
          },
        },
        group: { select: { max_student: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return exams.map((exam) => ({
      id: exam.id,
      topic: exam.topic,
      date: exam.date,
      minScore: exam.minScore,
      maxScore: exam.maxScore,
      students: exam.examResults.length,
      status: exam.status,
      passed: exam.examResults
        .filter((r) => r.passed)
        .map((r) => ({
          id: r.student.id,
          name: `${r.student.first_name} ${r.student.last_name}`,
          score: r.score,
        })),
      failed: exam.examResults
        .filter((r) => !r.passed && r.status !== 'PENDING') // Actually, failed should be checked and !passed
        .map((r) => ({
          id: r.student.id,
          name: `${r.student.first_name} ${r.student.last_name}`,
          score: r.score,
        })),
    }));
  }

  async getGroupStatistics(id: number) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        studentGroups: {
          include: { student: true },
        },
        lessons: {
          include: {
            attendances: true,
            homeworks: {
              include: { homeworkAnswerStudents: true },
            },
          },
        },
        exams: {
          include: { examResults: true },
        },
      },
    });

    if (!group) throw new NotFoundException('Guruh topilmadi!');

    // 1. Davomat taqsimoti
    let totalAttendances = 0;
    let presentCount = 0;
    group.lessons.forEach((lesson) => {
      lesson.attendances.forEach((att) => {
        totalAttendances++;
        if (att.isPresent) presentCount++;
      });
    });

    const presentPercent = totalAttendances
      ? Math.round((presentCount / totalAttendances) * 100)
      : 0;
    const absentPercent = totalAttendances ? 100 - presentPercent : 0;
    const attendanceDistribution = [
      { name: 'Qatnashgan', value: presentPercent || 1, color: '#10b981' }, // fallback to 1 to show empty chart
      {
        name: 'Qatnashmagan',
        value: absentPercent || (presentPercent ? 0 : 99),
        color: '#ef4444',
      },
    ];

    // 2. To'lovlar holati
    const studentIds = group.studentGroups.map((sg) => sg.student_id);
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const payments = await this.prisma.payment.findMany({
      where: {
        student_id: { in: studentIds },
        createdAt: { gte: startOfMonth },
      },
    });

    const paidCount = new Set(payments.map((p) => p.student_id)).size;
    const unpaidCount = studentIds.length - paidCount;
    const paymentStatus = [
      { name: "To'laganlar", value: paidCount, color: '#10b981' },
      { name: "To'lamaganlar", value: unpaidCount, color: '#ef4444' },
    ];

    // 3. O'zlashtirish dinamikasi
    const performanceMap = new Map<
      string,
      {
        attendance: { total: number; present: number };
        homeworks: { totalGrade: number; count: number };
      }
    >();
    group.lessons.forEach((lesson) => {
      const monthName = lesson.createdAt.toLocaleString('uz-UZ', {
        month: 'short',
      });
      if (!performanceMap.has(monthName)) {
        performanceMap.set(monthName, {
          attendance: { total: 0, present: 0 },
          homeworks: { totalGrade: 0, count: 0 },
        });
      }
      const data = performanceMap.get(monthName)!;

      lesson.attendances.forEach((att) => {
        data.attendance.total++;
        if (att.isPresent) data.attendance.present++;
      });

      lesson.homeworks.forEach((hw) => {
        hw.homeworkAnswerStudents.forEach((ans) => {
          if (ans.grade) {
            data.homeworks.totalGrade += ans.grade;
            data.homeworks.count++;
          }
        });
      });
    });

    let performance = Array.from(performanceMap.entries())
      .map(([month, data]) => ({
        name: month,
        avg: data.homeworks.count
          ? Math.round(data.homeworks.totalGrade / data.homeworks.count)
          : 0,
        attendance: data.attendance.total
          ? Math.round((data.attendance.present / data.attendance.total) * 100)
          : 0,
      }))
      .slice(-4);

    // Agar darslar yo'q bo'lsa default data
    if (performance.length === 0) {
      performance = [
        {
          name: new Date().toLocaleString('uz-UZ', { month: 'short' }),
          avg: 0,
          attendance: 0,
        },
      ];
    }

    // 4. Peshqadamlar
    const studentScores = new Map<
      number,
      { name: string; totalScore: number }
    >();
    group.studentGroups.forEach((sg) => {
      studentScores.set(sg.student_id, {
        name: `${sg.student.first_name} ${sg.student.last_name}`,
        totalScore: 0,
      });
    });

    group.exams.forEach((exam) => {
      exam.examResults.forEach((res) => {
        if (studentScores.has(res.student_id) && res.score !== null) {
          studentScores.get(res.student_id)!.totalScore += res.score;
        }
      });
    });

    group.lessons.forEach((lesson) => {
      lesson.homeworks.forEach((hw) => {
        hw.homeworkAnswerStudents.forEach((ans) => {
          if (ans.grade !== null && studentScores.has(ans.student_id)) {
            studentScores.get(ans.student_id)!.totalScore += ans.grade;
          }
        });
      });
    });

    const topStudents = Array.from(studentScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3)
      .map((s) => ({
        name: s.name,
        score: s.totalScore,
      }));

    // Bajarilgan uyga vazifalar foizi (Umumiy)
    let totalHw = 0;
    let checkedHw = 0;
    group.lessons.forEach((lesson) => {
      lesson.homeworks.forEach((hw) => {
        totalHw += studentIds.length;
        checkedHw += hw.homeworkAnswerStudents.filter(
          (ans) => ans.status === 'CHECKED',
        ).length;
      });
    });

    const hwCompleted = totalHw ? Math.round((checkedHw / totalHw) * 100) : 0;
    const homeworkCompletion = [
      { name: 'Bajarilgan', value: hwCompleted || 1, color: '#6366f1' },
      {
        name: 'Bajarilmagan',
        value: 100 - hwCompleted || (hwCompleted ? 0 : 99),
        color: '#f43f5e',
      },
    ];

    return {
      performance,
      attendanceDistribution,
      paymentStatus,
      homeworkCompletion,
      topStudents,
    };
  }
  async getGroupJournal(id: number) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        studentGroups: { include: { student: true } },
        lessons: {
          include: {
            homeworks: { include: { homeworkAnswerStudents: true } },
          },
        },
        exams: { include: { examResults: true } },
      },
    });

    if (!group) throw new NotFoundException('Guruh topilmadi!');

    const journal = group.studentGroups.map((sg) => {
      const studentId = sg.student.id;
      let totalScore = 0;
      let count = 0;
      let lastGrade = 0;
      let lastDate = new Date(0);

      // From Exams
      group.exams.forEach((exam) => {
        const result = exam.examResults.find((r) => r.student_id === studentId);
        if (result && result.score !== null) {
          totalScore += result.score;
          count++;
          if (result.createdAt > lastDate) {
            lastDate = result.createdAt;
            lastGrade = result.score;
          }
        }
      });

      // From Homeworks
      group.lessons.forEach((lesson) => {
        lesson.homeworks.forEach((hw) => {
          const ans = hw.homeworkAnswerStudents.find(
            (a) => a.student_id === studentId,
          );
          if (ans && ans.grade !== null) {
            totalScore += ans.grade;
            count++;
            if (ans.updatedAt > lastDate) {
              lastDate = ans.updatedAt;
              lastGrade = ans.grade;
            }
          }
        });
      });

      const average = count === 0 ? 0 : Math.round(totalScore / count);
      let status = 'C';
      if (average >= 90) status = 'A+';
      else if (average >= 80) status = 'A';
      else if (average >= 70) status = 'B';

      return {
        id: studentId,
        name: `${sg.student.first_name} ${sg.student.last_name}`,
        average,
        lastGrade,
        status,
      };
    });

    return journal;
  }

  async getGroupAttendance(id: number) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        studentGroups: { include: { student: true } },
        lessons: {
          orderBy: { createdAt: 'asc' },
          include: {
            attendances: true,
            homeworks: {
              include: { homeworkAnswerStudents: true },
            },
          },
        },
      },
    });

    if (!group) throw new NotFoundException('Guruh topilmadi!');

    const lessons = group.lessons.map((l) => ({
      id: l.id,
      topic: l.topic,
      date: l.date,
      createdAt: l.createdAt,
    }));

    const students = group.studentGroups.map((sg) => {
      const studentId = sg.student.id;
      const studentAttendances = {};
      const studentHomeworks = {};

      group.lessons.forEach((lesson) => {
        const att = lesson.attendances.find((a) => a.student_id === studentId);
        studentAttendances[lesson.id] = att ? att.isPresent : null;

        let hwStatus: string | null = null;
        if (lesson.homeworks && lesson.homeworks.length > 0) {
          const hw = lesson.homeworks[0];
          const answer = hw.homeworkAnswerStudents.find(
            (hws) => hws.student_id === studentId,
          );
          hwStatus = answer ? answer.status : 'NOT_SUBMITTED';
        }
        studentHomeworks[lesson.id] = hwStatus;
      });

      return {
        id: studentId,
        name: `${sg.student.first_name} ${sg.student.last_name}`,
        phone: sg.student.phone,
        attendances: studentAttendances,
        homeworks: studentHomeworks,
      };
    });

    return { lessons, students };
  }

  async saveGroupAttendance(
    groupId: number,
    userId: number,
    dto: import('./dto/save-attendance.dto').SaveAttendanceDto,
  ) {
    // Basic checks
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');

    for (const [lessonIdStr, studentsData] of Object.entries(dto.attendances)) {
      const lessonId = parseInt(lessonIdStr);

      for (const [studentIdStr, status] of Object.entries(studentsData)) {
        const studentId = parseInt(studentIdStr);

        // Fetch existing attendance to upsert/delete
        const existing = await this.prisma.attendance.findFirst({
          where: { lesson_id: lessonId, student_id: studentId },
        });

        if (status === null) {
          if (existing) {
            await this.prisma.attendance.delete({
              where: { id: existing.id },
            });
          }
        } else {
          if (existing) {
            await this.prisma.attendance.update({
              where: { id: existing.id },
              data: { isPresent: status, marked_by_id: userId },
            });
          } else {
            await this.prisma.attendance.create({
              data: {
                lesson_id: lessonId,
                student_id: studentId,
                marked_by_id: userId,
                isPresent: status,
              },
            });
          }
        }
      }
    }

    return { success: true };
  }
}
