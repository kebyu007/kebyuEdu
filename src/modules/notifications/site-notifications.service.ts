import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';

@Injectable()
export class SiteNotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(userId: number, title: string, message: string) {
    return this.prisma.notification.create({
      data: {
        user_id: userId,
        title,
        message,
      },
    });
  }

  async getUserNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(notificationId: number, userId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new NotFoundException(
        'Xabarnoma topilmadi yoki sizga tegishli emas',
      );
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true },
    });
  }
}
