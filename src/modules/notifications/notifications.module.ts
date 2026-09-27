import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { TelegramService } from './telegram.service';
import { PrismaModule } from '@/core/database/prisma.module';
import { NotificationsController } from './notifications.controller';
import { SiteNotificationsService } from './site-notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [PrismaModule],
  providers: [MailService, TelegramService, SiteNotificationsService, NotificationsGateway],
  exports: [MailService, TelegramService, SiteNotificationsService, NotificationsGateway],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
