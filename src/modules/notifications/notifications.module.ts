import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { TelegramService } from './telegram.service';
import { PrismaModule } from '@/core/database/prisma.module';
import { NotificationsController } from './notifications.controller';
import { SiteNotificationsService } from './site-notifications.service';

@Module({
  imports: [PrismaModule],
  providers: [MailService, TelegramService, SiteNotificationsService],
  exports: [MailService, TelegramService, SiteNotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
