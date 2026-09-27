import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { SiteNotificationsService } from '../notifications/site-notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: SiteNotificationsService,
  ) {}

  async create(adminId: number, dto: CreatePaymentDto) {
    const student = await this.prisma.user.findUnique({
      where: { id: dto.student_id },
    });

    if (!student) {
      throw new NotFoundException("O'quvchi topilmadi");
    }

    const payment = await this.prisma.payment.create({
      data: {
        student_id: dto.student_id,
        admin_id: adminId,
        amount: dto.amount,
        method: dto.method,
        month: dto.month,
        comment: dto.comment,
        status: 'COMPLETED',
      },
      include: {
        admin: { select: { first_name: true, last_name: true } },
      },
    });

    // In-app Notification yuborish
    const formattedAmount = Number(dto.amount).toLocaleString('uz-UZ');
    const message = `Sizning ${formattedAmount} so'm to'lovingiz tizimga kiritildi (Admin: ${payment.admin.first_name}). ${dto.month ? 'Oy: ' + dto.month : ''}`;

    await this.notifications.createNotification(
      dto.student_id,
      "To'lov qabul qilindi ✅",
      message,
    );

    // Balance ni oshirish (to'lov kiritildi)
    await this.prisma.user.update({
      where: { id: dto.student_id },
      data: {
        balance: {
          increment: dto.amount
        }
      }
    });

    return payment;
  }

  async findAll() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { id: true, first_name: true, last_name: true, phone: true },
        },
        admin: { select: { id: true, first_name: true, last_name: true } },
      },
    });
  }

  async findMyPayments(studentId: number) {
    return this.prisma.payment.findMany({
      where: { student_id: studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { first_name: true, last_name: true } },
      },
    });
  }

  async chargeStudent(adminId: number, studentId: number, amount: number, month: string, comment?: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException("O'quvchi topilmadi");
    }

    // Balance dan pulni yechish (ayirish)
    await this.prisma.user.update({
      where: { id: studentId },
      data: {
        balance: {
          decrement: amount
        }
      }
    });

    // In-app Notification yuborish
    const formattedAmount = Number(amount).toLocaleString('uz-UZ');
    const message = `Sizdan joriy oy (${month}) uchun ${formattedAmount} so'm to'lov yechib olindi.${comment ? ' Izoh: ' + comment : ''}`;

    await this.notifications.createNotification(
      studentId,
      "To'lov yechildi 📉",
      message,
    );

    return { success: true, newBalance: Number(student.balance) - amount };
  }
}
