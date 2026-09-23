import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(month?: string) {
    // Agar month berilmasa joriy oyni olamiz (YYYY-MM)
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    // 1. Moliyaviy hisobot
    const payments = await this.prisma.payment.aggregate({
      where: { month: targetMonth, status: 'COMPLETED' },
      _sum: { amount: true },
    });
    const totalRevenue = payments._sum.amount
      ? parseFloat(payments._sum.amount.toString())
      : 0;

    // 2. Umumiy Statistika
    const totalStudents = await this.prisma.user.count({
      where: { role: 'STUDENT', status: 'active' },
    });
    const frozenStudents = await this.prisma.user.count({
      where: { role: 'STUDENT', status: 'freeze' },
    });
    const archivedStudents = await this.prisma.user.count({
      where: { role: 'STUDENT', status: { in: ['inactive', 'graduated'] } },
    });
    const totalTeachers = await this.prisma.user.count({
      where: { role: 'TEACHER', status: 'active' },
    });
    const activeGroups = await this.prisma.group.count({
      where: { status: 'active' },
    });
    const totalCourses = await this.prisma.course.count({
      where: { status: 'active' },
    });

    // Chart Data (Last 7 months)
    const monthNames = [
      'Yan',
      'Fev',
      'Mar',
      'Apr',
      'May',
      'Iyun',
      'Iyul',
      'Avg',
      'Sen',
      'Okt',
      'Noy',
      'Dek',
    ];
    const monthlyRevenueChart: any[] = [];
    const currentDate = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const p = await this.prisma.payment.aggregate({
        where: { month: mStr, status: 'COMPLETED' },
        _sum: { amount: true },
      });

      monthlyRevenueChart.push({
        name: monthNames[d.getMonth()],
        total: p._sum.amount ? parseFloat(p._sum.amount.toString()) : 0,
      });
    }

    // 3. Qarzdorlar (Debtors)
    // Aktiv o'quvchilar -> Qaysidir aktiv guruhda bor -> Shu oy uchun to'lovi yo'q
    const allActiveStudentsInGroups = await this.prisma.studentGroup.findMany({
      where: { status: 'active' },
      include: {
        student: {
          select: { id: true, first_name: true, last_name: true, phone: true },
        },
        group: { select: { name: true } },
      },
    });

    const currentMonthPayments = await this.prisma.payment.findMany({
      where: { month: targetMonth, status: 'COMPLETED' },
      select: { student_id: true },
    });
    const paidStudentIds = currentMonthPayments.map((p) => p.student_id);

    const debtors = allActiveStudentsInGroups
      .filter((sg) => !paidStudentIds.includes(sg.student_id))
      .map((sg) => ({
        id: sg.student.id,
        name: `${sg.student.first_name} ${sg.student.last_name}`,
        phone: sg.student.phone,
        group: sg.group.name,
      }));

    // Dublikatlarni tozalash (agar 1 o'quvchi 2 ta guruhda qarzdor bo'lsa)
    const uniqueDebtors = Array.from(
      new Map(debtors.map((item) => [item.id, item])).values(),
    );

    // 4. O'zlashtirish va Davomat
    const totalHomeworksSubmitted =
      await this.prisma.homeworkAnswerStudent.count({
        where: {
          createdAt: {
            gte: new Date(`${targetMonth}-01`),
            lt: new Date(`${targetMonth}-31T23:59:59.999Z`),
          },
        },
      });

    const attendances = await this.prisma.attendance.findMany({
      where: {
        createdAt: {
          gte: new Date(`${targetMonth}-01`),
          lt: new Date(`${targetMonth}-31T23:59:59.999Z`),
        },
      },
    });

    const presentCount = attendances.filter((a) => a.isPresent).length;
    const totalAttendances = attendances.length;
    const averageAttendance =
      totalAttendances === 0
        ? 0
        : parseFloat(((presentCount / totalAttendances) * 100).toFixed(2));

    // 5. Recent Payments
    const recentPayments = await this.prisma.payment.findMany({
      where: { month: targetMonth },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        student: { select: { first_name: true, last_name: true } },
      },
    });

    // 6. Annual Profit
    const currentYear = currentDate.getFullYear();
    const annualProfitChart: any[] = [];
    for (let i = 0; i < 12; i++) {
      const mStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      const p = await this.prisma.payment.aggregate({
        where: { month: mStr, status: 'COMPLETED' },
        _sum: { amount: true },
      });
      annualProfitChart.push({
        name: monthNames[i],
        total: p._sum.amount ? parseFloat(p._sum.amount.toString()) : 0,
      });
    }

    // 7. Today's Schedule (Active groups for today's weekday)
    const jsDay = currentDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    // Convert JS day to 1-7 format if needed, but assuming standard 0-6 or 1-7.
    // Let's just return active groups, frontend can filter or we just return all active groups for simplicity
    const activeGroupsList = await this.prisma.group.findMany({
      where: { status: 'active' },
      include: {
        course: { select: { name: true } },
        room: { select: { name: true } },
      },
      orderBy: { start_time: 'asc' },
    });

    // Filter by today's weekday (assuming 1=Mon, 2=Tue... 0=Sun or 7=Sun)
    // Most Uzbek systems use 1=Mon ... 6=Sat, 0 or 7=Sun
    const todayWeekday = jsDay === 0 ? 0 : jsDay; // Try to match JS day
    const todaySchedule = activeGroupsList.filter(
      (g) =>
        g.weekday.includes(todayWeekday) ||
        g.weekday.includes(jsDay === 0 ? 7 : jsDay),
    );

    return {
      financial: {
        totalRevenue,
        monthlyRevenueChart,
        annualProfitChart,
        recentPayments,
      },
      statistics: {
        totalStudents,
        frozenStudents,
        archivedStudents,
        totalTeachers,
        activeGroups,
        totalCourses,
      },
      debtors: uniqueDebtors,
      performance: {
        averageAttendance,
        totalHomeworksSubmitted,
      },
      todaySchedule,
    };
  }
}
