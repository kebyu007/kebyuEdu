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
    const { search, status, page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [groups, total] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { name: true } },
          room: { select: { name: true } },
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
              select: { id: true, first_name: true, last_name: true },
            },
          },
        },
        studentGroups: {
          include: {
            student: {
              select: { id: true, first_name: true, last_name: true },
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
}
