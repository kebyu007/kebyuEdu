import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // passport-local aslida usernameField deb qabul qiladi, biz uni phone ga o'zgartiramiz
    super({ usernameField: 'phone', passwordField: 'password' });
  }

  async validate(phone: string, pass: string): Promise<any> {
    const user = await this.authService.validateUser(phone, pass);
    if (!user) {
      throw new UnauthorizedException("Telefon raqam yoki parol noto'g'ri");
    }
    return user;
  }
}
