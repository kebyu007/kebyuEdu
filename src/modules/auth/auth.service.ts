import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/core/database/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as argon2 from 'argon2';
import { MailService } from '../notifications/mail.service';
import { TelegramService } from '../notifications/telegram.service';
import { deleteFile } from '@/common/utils/file-cleanup.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private mailService: MailService,
    private telegramService: TelegramService,
  ) {}

  async validateUser(phone: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (
      user &&
      user.status === 'active' &&
      (await argon2.verify(user.password, pass))
    ) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { phone: user.phone, sub: user.id };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: process.env.JWT_SECRET || 'super-secret-erp-key',
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET || 'super-refresh-erp-key',
    });

    // Refresh tokenni Redis-ga yozish (7 kun)
    await this.cacheManager.set(
      `refresh_token:${user.id}`,
      refresh_token,
      604800000,
    );

    return {
      access_token,
      refresh_token,
      user,
    };
  }

  async refreshTokens(userId: number, phone: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException(
        'Foydalanuvchi bloklangan yoki topilmadi',
      );
    }
    return this.login(user);
  }

  async logout(userId: number) {
    await this.cacheManager.del(`refresh_token:${userId}`);
    return { message: 'Muvaffaqiyatli tizimdan chiqdingiz' };
  }

  async forgotPassword(method: 'email' | 'telegram', identifier: string) {
    if (method === 'telegram') {
      const botUrl = this.telegramService.getBotUrl();
      return {
        message:
          'Iltimos, Telegram botimizga kirib "Raqamni ulashish" tugmasini bosing',
        botUrl,
      };
    }

    if (method === 'email') {
      const user = await this.prisma.user.findUnique({
        where: { email: identifier },
      });
      if (!user)
        throw new UnauthorizedException('Bunday email manzil topilmadi');

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // OTP uchun Redisda 5 minut
      await this.cacheManager.set(`reset_otp:${otp}`, user.id, 300000);

      await this.mailService.sendOtp(identifier, otp);

      return { message: 'Tasdiqlash kodi email pochtangizga yuborildi' };
    }
  }

  async resetPassword(token: string, newPassword: string) {
    // 1. Email OTP ni tekshiramiz
    let userId = await this.cacheManager.get<number>(`reset_otp:${token}`);
    let isOtp = true;

    // 2. Agar OTP bo'lmasa, Telegram UUID tokenini tekshiramiz
    if (!userId) {
      userId = await this.cacheManager.get<number>(`reset_token:${token}`);
      isOtp = false;
    }

    if (!userId) {
      throw new UnauthorizedException(
        "Tasdiqlash kodi yoki havola noto'g'ri/muddati o'tgan",
      );
    }

    const hashedPassword = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Xotiradan tokenni o'chiramiz
    if (isOtp) await this.cacheManager.del(`reset_otp:${token}`);
    else await this.cacheManager.del(`reset_token:${token}`);

    // Barcha eski qurilmalardan avtomatik chiqarib yuborish
    await this.cacheManager.del(`refresh_token:${userId}`);

    return { message: 'Parol muvaffaqiyatli yangilandi' };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        photo: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException('Foydalanuvchi topilmadi');
    return user;
  }

  async updateProfile(userId: number, body: any, file?: Express.Multer.File) {
    const { first_name, last_name, phone, email, oldPassword, newPassword } =
      body;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      if (file) deleteFile(file.path);
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    // Phone or email duplication check
    if (phone || email) {
      const duplicateUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            phone ? { phone } : undefined,
            email ? { email } : undefined,
          ].filter(Boolean) as any,
          NOT: { id: userId },
        },
      });

      if (duplicateUser) {
        if (file) deleteFile(file.path);
        throw new ConflictException(
          'Bu telefon yoki email boshqa foydalanuvchiga tegishli!',
        );
      }
    }

    const data: any = {};
    if (first_name) data.first_name = first_name;
    if (last_name) data.last_name = last_name;
    if (phone) data.phone = phone;
    if (email) data.email = email;
    if (file) data.photo = file.path;

    if (oldPassword && newPassword) {
      const isPasswordValid = await argon2.verify(user.password, oldPassword);
      if (!isPasswordValid) {
        if (file) deleteFile(file.path);
        throw new BadRequestException("Eski parol noto'g'ri");
      }
      data.password = await argon2.hash(newPassword);
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          phone: true,
          email: true,
          photo: true,
        },
      });

      if (file && user.photo) {
        deleteFile(user.photo);
      }

      return { message: 'Profil muvaffaqiyatli yangilandi', user: updated };
    } catch (error) {
      if (file) deleteFile(file.path);
      throw error;
    }
  }
}
