import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const getMulterOptions = (
  destination: string,
  type: 'image' | 'document' = 'image',
) => {
  return {
    storage: diskStorage({
      destination: `./uploads/${destination}`,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit (can be customized later)
    },
    fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
      let allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];

      if (type === 'document') {
        allowedMimes = [
          ...allowedMimes,
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/zip',
          'application/x-zip-compressed',
          'application/x-rar-compressed',
        ];
      }

      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        const msg =
          type === 'document'
            ? 'Faqat rasm yoki hujjat (pdf, doc, zip, rar) yuklash mumkin!'
            : 'Faqat rasm (jpg, jpeg, png) yuklash mumkin!';
        cb(new BadRequestException(msg), false);
      }
    },
  };
};
