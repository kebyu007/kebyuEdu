import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { FilterCourseDto } from './dto/filter-course.dto';
import { PrismaService } from '@/core/database/prisma.service';
import { deleteFile } from '@/common/utils/file-cleanup.util';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto, file?: Express.Multer.File) {
    try {
      return await this.prisma.course.create({
        data: {
          ...createCourseDto,
          photo: file ? file.path : null,
        },
      });
    } catch (error: any) {
      if (file) deleteFile(file.path);
      if (error.code === 'P2002') {
        throw new ConflictException('Ushbu nomdagi kurs allaqachon mavjud!');
      }
      throw error;
    }
  }

  async findAll(filterDto: FilterCourseDto) {
    const { search, status, page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { groups: true },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        groups: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Kurs topilmadi!');
    }
    return course;
  }

  async update(
    id: number,
    updateCourseDto: UpdateCourseDto,
    file?: Express.Multer.File,
  ) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      if (file) deleteFile(file.path);
      throw new NotFoundException('Kurs topilmadi!');
    }

    try {
      const updated = await this.prisma.course.update({
        where: { id },
        data: {
          ...updateCourseDto,
          photo: file ? file.path : course.photo,
        },
      });

      if (file && course.photo) {
        deleteFile(course.photo);
      }

      return updated;
    } catch (error: any) {
      if (file) deleteFile(file.path);
      if (error.code === 'P2002') {
        throw new ConflictException('Ushbu nomdagi kurs allaqachon mavjud!');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id); // Check existence

    // Soft delete
    return await this.prisma.course.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }
}
