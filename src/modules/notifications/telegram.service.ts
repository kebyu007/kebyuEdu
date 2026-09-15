import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Markup } from 'telegraf';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '@/core/database/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (token) {
      this.bot = new Telegraf(token);
    } else {
      this.logger.warn(
        "TELEGRAM_BOT_TOKEN .env faylda ko'rsatilmagan. Bot ishga tushmaydi.",
      );
    }
  }

  onModuleInit() {
    if (!this.bot) return;

    this.bot.start((ctx) => {
      ctx.reply(
        'Assalomu alaykum! Parolni tiklash uchun telefon raqamingizni ulashing.',
        Markup.keyboard([Markup.button.contactRequest('📱 Raqamni ulashish')])
          .resize()
          .oneTime(),
      );
    });

    this.bot.on('contact', async (ctx) => {
      const contact = ctx.message.contact;
      // Telegramdan kelgan raqamlar ko'pincha + siz keladi, bazamizda qanday turganiga qarab to'g'irlaymiz
      let phone = contact.phone_number;
      if (!phone.startsWith('+')) {
        phone = '+' + phone;
      }

      const user = await this.prisma.user.findUnique({ where: { phone } });
      if (!user) {
        return ctx.reply('Sizning raqamingiz tizimda topilmadi.');
      }

      // Chat ID ni saqlaymiz
      const chatId = ctx.chat.id.toString();
      await this.prisma.user.update({
        where: { id: user.id },
        data: { telegram_chat_id: chatId },
      });

      // Token generatsiya qilish
      const token = uuidv4();
      await this.cacheManager.set(`reset_token:${token}`, user.id, 300000); // 5 minut

      const frontUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      const resetLink = `${frontUrl}/reset-password?token=${token}`;

      await ctx.reply(
        `Sizning parolni tiklash havolangiz:\n${resetLink}\n\nBu havola atigi 5 daqiqa amal qiladi!`,
        Markup.removeKeyboard(),
      );
    });

    this.bot
      .launch()
      .then(() => this.logger.log('Telegram bot muvaffaqiyatli ishga tushdi'))
      .catch((e) => this.logger.error('Botni ishga tushirishda xato:', e));

    // Tizim yopilayotganda botni to'xtatish
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  public getBotUrl(): string {
    return (
      this.configService.get<string>('TELEGRAM_BOT_URL') ||
      'https://t.me/your_bot_name'
    );
  }
}
