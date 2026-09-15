import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { TelegramService } from './telegram.service';
import { PrismaModule } from '@/core/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MailService, TelegramService],
  exports: [MailService, TelegramService],
})
export class NotificationsModule {}
