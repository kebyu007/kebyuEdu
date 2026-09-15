import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '@/common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Tizimga kirish va tokenlarni olish' })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Public() // Global JWT guard'dan qochamiz
  @UseGuards(JwtRefreshAuthGuard) // Refresh guard orqali tekshiramiz
  @Post('refresh')
  async refreshTokens(@Request() req) {
    // req.user ichiga JwtRefreshStrategy'dan qaytgan ma'lumotlar keladi
    return this.authService.refreshTokens(req.user.id, req.user.phone);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tizimdan chiqish (Logout)',
    description: '🔒 Himoyalangan',
  })
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(
    @Body() body: import('./dto/forgot-password.dto').ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(body.method, body.identifier);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body() body: import('./dto/reset-password.dto').ResetPasswordDto,
  ) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
