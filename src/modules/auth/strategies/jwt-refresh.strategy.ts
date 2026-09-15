import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Yoki body'dan olish mumkin
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') as string,
      passReqToCallback: true, // Request obyektini olish
    } as any);
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.headers.authorization
      ?.replace('Bearer ', '')
      .trim();
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token yuborilmagan');
    }

    const userId = payload.sub;

    // Redis'dan tokenni izlaymiz
    const savedToken = await this.cacheManager.get(`refresh_token:${userId}`);

    if (!savedToken || savedToken !== refreshToken) {
      throw new UnauthorizedException(
        "Refresh token yaroqsiz yoki o'chirilgan",
      );
    }

    // Yangi access token generatsiya qilish uchun AuthController ga req.user qilib qaytaramiz
    return { id: userId, phone: payload.phone };
  }
}
