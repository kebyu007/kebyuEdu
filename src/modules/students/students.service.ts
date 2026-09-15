import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { FilterStudentDto } from './dto/filter-student.dto';
import { PrismaService } from '@/core/database/prisma.service';
import { deleteFile } from '@/common/utils/file-cleanup.util';
import * as argon2 from 'argon2';
import * as fs from 'fs';
import { UserRoles, Prisma } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(createStudentDto: CreateStudentDto, file?: Express.Multer.File) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: createStudentDto.phone },
          { email: createStudentDto.email },
        ],
      },
    });

    if (existingUser) {
      if (file) deleteFile(file.path);
      throw new ConflictException(
        'Bu telefon raqam yoki email allaqachon band!',
      );
    }

    try {
      const hashedPassword = await argon2.hash(createStudentDto.password);

      const student = await this.prisma.user.create({
        data: {
          first_name: createStudentDto.first_name,
          last_name: createStudentDto.last_name,
          phone: createStudentDto.phone,
          email: createStudentDto.email,
          password: hashedPassword,
          address: createStudentDto.address,
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
    const { status, search } = filterDto;

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
      ];
    }

    const students = await this.prisma.user.findMany({
      where,
      include: {
        studentGroups: {
          include: { group: true },
        },
      },
    });

    return students.map((s) => {
      const { password, ...result } = s;
      return result;
    });
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
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Bu telefon raqam yoki email allaqachon boshqa foydalanuvchiga tegishli!',
        );
      }
      throw error;
    }
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
