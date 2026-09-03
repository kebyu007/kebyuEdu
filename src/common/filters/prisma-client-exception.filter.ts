import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      // P2002: Unique constraint yechilmadi (Bunday yozuv allaqachon mavjud)
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        const target = exception.meta?.target as string[];
        const message = `Bunday qiymat allaqachon mavjud: ${target ? target.join(', ') : 'noma\'lum maydon'}`;

        response.status(status).json({
          statusCode: status,
          message: message,
          error: 'Conflict',
        });
        break;
      }
      
      // P2025: Qidirilayotgan yozuv topilmadi
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        const message = 'So\'ralgan ma\'lumot topilmadi';

        response.status(status).json({
          statusCode: status,
          message: message,
          error: 'Not Found',
        });
        break;
      }
      
      // P2003: Xorijiy kalit mos kelmadi
      case 'P2003': {
        const status = HttpStatus.BAD_REQUEST;
        const message = 'Bog\'langan ma\'lumotlar orasida xatolik yuz berdi (Xorijiy kalit mos kelmadi)';

        response.status(status).json({
          statusCode: status,
          message: message,
          error: 'Bad Request',
        });
        break;
      }
      
      // Qolgan barcha Prisma xatoliklari uchun default xatti-harakat
      default:
        super.catch(exception, host);
        break;
    }
  }
}