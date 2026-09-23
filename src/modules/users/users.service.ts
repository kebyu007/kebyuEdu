import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { PrismaService } from '@/core/database/prisma.service';
import { deleteFile } from '@/common/utils/file-cleanup.util';

@Injectable()
export class UsersService {
  constructor(private readonly service: PrismaService) {}

  async create(payload: CreateUserDto, file?: Express.Multer.File) {
    // Check if phone or email already exists
    const duplicateUser = await this.service.user.findFirst({
      where: {
        OR: [{ phone: payload.phone }, { email: payload.email }],
      },
    });

    if (duplicateUser) {
      if (file) deleteFile(file.path); // Rollback file upload
      throw new ConflictException(
        'This phone number or email is already registered!',
      );
    }

    try {
      const hashedPassword = await argon2.hash(payload.password);

      const user = await this.service.user.create({
        data: {
          ...payload,
          password: hashedPassword,
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          photo: true,
          address: true,
          attributes: true,
          createdAt: true,
        },
      });
      return user;
    } catch (error) {
      if (file) deleteFile(file.path); // Rollback on any database error
      throw error;
    }
  }

  async findAll(filterDto: FilterUserDto) {
    const { search, role, status, page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await this.service.$transaction([
      this.service.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          photo: true,
          address: true,
          birth_date: true,
          attributes: true,
          createdAt: true,
          studentGroups: { include: { group: true } },
          teacherGroups: { include: { group: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.service.user.count({ where }),
    ]);

    const usersWithAge = users.map((user) => {
      let age: number | null = null;
      if (user.birth_date) {
        const diff = Date.now() - user.birth_date.getTime();
        age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
      }
      return { ...user, age };
    });

    return {
      data: usersWithAge,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const user = await this.service.user.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        photo: true,
        address: true,
        birth_date: true,
        attributes: true,
        createdAt: true,
        studentGroups: {
          select: { group: { select: { id: true, name: true } } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    let age: number | null = null;
    if (user.birth_date) {
      const diff = Date.now() - user.birth_date.getTime();
      age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
    }

    return { ...user, age };
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    const existingUser = await this.service.user.findUnique({ where: { id } });
    if (!existingUser) {
      if (file) deleteFile(file.path);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    let hashedPassword = updateUserDto.password;
    if (updateUserDto.password) {
      hashedPassword = await argon2.hash(updateUserDto.password);
    }

    try {
      const updatedUser = await this.service.user.update({
        where: { id },
        data: {
          ...updateUserDto,
          ...(updateUserDto.password && { password: hashedPassword }),
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          photo: true,
          address: true,
          attributes: true,
          updatedAt: true,
        },
      });

      // Agar rasm muvaffaqiyatli yangilangan bo'lsa va eski rasm bor bo'lsa, eskisini o'chiramiz
      if (file && existingUser.photo) {
        deleteFile(existingUser.photo);
      }

      return updatedUser;
    } catch (error: any) {
      if (file) deleteFile(file.path); // Rollback on error
      if (error.code === 'P2002') {
        throw new ConflictException(
          'This phone number or email is already taken by another user!',
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.service.user.update({
      where: { id },
      data: { status: 'inactive' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        status: true,
      },
    });
  }
}
