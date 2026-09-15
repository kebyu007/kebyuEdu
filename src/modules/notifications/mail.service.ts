import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('MAIL_PORT') || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user:
          this.configService.get<string>('MAIL_USER') || 'your-email@gmail.com',
        pass:
          this.configService.get<string>('MAIL_PASS') || 'your-app-password',
      },
    });
  }

  async sendOtp(to: string, otp: string) {
    try {
      await this.transporter.sendMail({
        from: `"ERP System" <${this.configService.get<string>('MAIL_USER')}>`,
        to,
        subject: 'Parolni tiklash kodi (OTP)',
        text: `Sizning tasdiqlash kodingiz: ${otp}. Bu kod 5 daqiqa davomida amal qiladi.`,
        html: `<b>Sizning tasdiqlash kodingiz:</b> <h1>${otp}</h1><br><p>Bu kod 5 daqiqa davomida amal qiladi.</p>`,
      });
      this.logger.log(`OTP muvaffaqiyatli jo'natildi: ${to}`);
    } catch (error) {
      this.logger.error(`OTP yuborishda xatolik yuz berdi: ${error.message}`);
      // Biz throw Error qilsak bo'ladi, lekin hozircha ishlab chiqarish emas, faqat logda qoldiramiz.
      console.log(`[SIMULATION] Mail yuborish o'xshamadi. OTP: ${otp}`);
    }
  }
}
