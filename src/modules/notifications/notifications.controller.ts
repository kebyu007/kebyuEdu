import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { SiteNotificationsService } from './site-notifications.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Requires login
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly siteNotificationsService: SiteNotificationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "O'zimning xabarnomalarimni ko'rish" })
  getUserNotifications(@Req() req: any) {
    return this.siteNotificationsService.getUserNotifications(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: "Xabarnomani o'qildi qilib belgilash" })
  markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.siteNotificationsService.markAsRead(+id, req.user.id);
  }
}
