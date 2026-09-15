import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: any) {
    // payload ichida userId bo'ladi, biz uni bazadan topib olamiz
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        status: true,
        attributes: true, // ABAC Guard uchun juda muhim!
      },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException(
        'Foydalanuvchi bloklangan yoki topilmadi',
      );
    }

    // Bu yerdan qaytgan ob'ekt har bir so'rovda req.user ga aylanadi
    return user;
  }
}
