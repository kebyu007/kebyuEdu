import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { CreateLessonVideoDto } from './dto/create-lesson-video.dto';
import { UpdateLessonVideoDto } from './dto/update-lesson-video.dto';
import { deleteFile } from '@/common/utils/file-cleanup.util';

@Injectable()
export class LessonVideosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLessonVideoDto, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Video fayl kiritilmadi!');

    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: dto.lesson_id },
      });
      if (!lesson) {
        throw new NotFoundException('Dars topilmadi!');
      }

      if (lesson.group_id !== dto.group_id) {
        throw new BadRequestException('Bu dars ushbu guruhga tegishli emas!');
      }

      const size_mb = parseFloat((file.size / (1024 * 1024)).toFixed(2));

      return await this.prisma.lessonVideo.create({
        data: {
          lesson_id: dto.lesson_id,
          group_id: dto.group_id,
          title: dto.title || file.originalname,
          originalName: file.originalname,
          videoUrl: file.path,
          size_mb,
        },
      });
    } catch (error) {
      deleteFile(file.path);
      throw error;
    }
  }

  async findAllByLesson(lessonId: number) {
    return this.prisma.lessonVideo.findMany({
      where: { lesson_id: lessonId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, dto: UpdateLessonVideoDto) {
    const video = await this.prisma.lessonVideo.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video topilmadi!');

    return this.prisma.lessonVideo.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title : video.title,
      },
    });
  }

  async remove(id: number) {
    const video = await this.prisma.lessonVideo.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video topilmadi!');

    // Bazadan o'chirish
    await this.prisma.lessonVideo.delete({ where: { id } });

    // Serverdan jismoniy faylni o'chirish
    deleteFile(video.videoUrl);

    return { message: "Video muvaffaqiyatli o'chirildi" };
  }
}
