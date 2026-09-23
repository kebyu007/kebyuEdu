import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { FilterTeacherDto } from './dto/filter-teacher.dto';
import { PrismaService } from '@/core/database/prisma.service';
import { deleteFile } from '@/common/utils/file-cleanup.util';
import * as argon2 from 'argon2';
import * as fs from 'fs';
import { UserRoles, Prisma } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async create(createTeacherDto: CreateTeacherDto, file?: Express.Multer.File) {
    const orConditions: any[] = [{ phone: createTeacherDto.phone }];
    if (createTeacherDto.email && createTeacherDto.email.trim() !== '') {
      orConditions.push({ email: createTeacherDto.email.trim() });
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
      const rawPassword = createTeacherDto.password || '123456';
      const hashedPassword = await argon2.hash(rawPassword);

      const teacher = await this.prisma.user.create({
        data: {
          first_name: createTeacherDto.first_name,
          last_name: createTeacherDto.last_name,
          phone: createTeacherDto.phone,
          email:
            createTeacherDto.email && createTeacherDto.email.trim() !== ''
              ? createTeacherDto.email.trim()
              : null,
          password: hashedPassword,
          address: createTeacherDto.address || null,
          birth_date: createTeacherDto.birth_date,
          role: UserRoles.TEACHER,
          photo: file ? file.path : null,
        },
      });

      const { password, ...result } = teacher;
      return result;
    } catch (error: any) {
      if (file) deleteFile(file.path);
      throw error;
    }
  }

  async findAll(filterDto: FilterTeacherDto) {
    const { status, search, page = 1, limit = 10 } = filterDto;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.UserWhereInput = {
      role: UserRoles.TEACHER,
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

    const [total, teachers] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          teacherGroups: {
            include: { group: true },
          },
        },
      }),
    ]);

    const formattedTeachers = teachers.map((t) => {
      const { password, ...result } = t;
      return result;
    });

    return {
      data: formattedTeachers,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async findOne(id: number) {
    const teacher = await this.prisma.user.findFirst({
      where: { id, role: UserRoles.TEACHER },
      include: {
        teacherGroups: {
          include: { group: true },
        },
      },
    });

    if (!teacher) throw new NotFoundException("O'qituvchi topilmadi");

    const { password, ...result } = teacher;
    return result;
  }

  async update(
    id: number,
    updateTeacherDto: UpdateTeacherDto,
    file?: Express.Multer.File,
  ) {
    const teacher = await this.prisma.user.findFirst({
      where: { id, role: UserRoles.TEACHER },
    });
    if (!teacher) {
      if (file) deleteFile(file.path);
      throw new NotFoundException("O'qituvchi topilmadi");
    }

    let hashedPassword = teacher.password;
    if (updateTeacherDto.password) {
      hashedPassword = await argon2.hash(updateTeacherDto.password);
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: {
          ...updateTeacherDto,
          password: hashedPassword,
          photo: file ? file.path : teacher.photo,
        },
      });

      // Eskisini o'chirish
      if (file && teacher.photo) {
        deleteFile(teacher.photo);
      }

      const { password, ...result } = updated;
      return result;
    } catch (error: any) {
      if (file) deleteFile(file.path);
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Bu telefon raqam yoki email allaqachon boshqa foydalanuvchiga tegishli!',
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    const teacher = await this.prisma.user.findFirst({
      where: { id, role: UserRoles.TEACHER },
    });
    if (!teacher) throw new NotFoundException("O'qituvchi topilmadi");

    // Soft delete qilinadi (status o'zgaradi)
    await this.prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return { message: "O'qituvchi muvaffaqiyatli arxivlandi (Soft Delete)" };
  }
}
