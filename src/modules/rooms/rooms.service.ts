import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { FilterRoomDto } from './dto/filter-room.dto';
import { PrismaService } from '@/core/database/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(createRoomDto: CreateRoomDto) {
    try {
      return await this.prisma.room.create({
        data: createRoomDto,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ushbu nomdagi xona allaqachon mavjud!');
      }
      throw error;
    }
  }

  async findAll(filterDto: FilterRoomDto) {
    const { search, status, page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [rooms, total] = await this.prisma.$transaction([
      this.prisma.room.findMany({
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
      this.prisma.room.count({ where }),
    ]);

    return {
      data: rooms,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        groups: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Xona topilmadi!');
    }
    return room;
  }

  async update(id: number, updateRoomDto: UpdateRoomDto) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) {
      throw new NotFoundException('Xona topilmadi!');
    }

    try {
      return await this.prisma.room.update({
        where: { id },
        data: updateRoomDto,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ushbu nomdagi xona allaqachon mavjud!');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id); // Check existence

    // Soft delete
    return await this.prisma.room.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }
}
