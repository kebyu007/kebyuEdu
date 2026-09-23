import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const getMulterOptions = (
  destination: string,
  type: 'image' | 'document' | 'video' = 'image',
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
      fileSize: type === 'video' ? 2 * 1024 * 1024 * 1024 : 10 * 1024 * 1024, // Videos up to 2GB, others 10MB
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
      } else if (type === 'video') {
        allowedMimes = [
          'video/mp4',
          'video/x-matroska', // mkv
          'video/x-msvideo', // avi
          'video/quicktime', // mov
        ];
      }

      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        let msg = 'Faqat rasm (jpg, jpeg, png) yuklash mumkin!';
        if (type === 'document')
          msg = 'Faqat rasm yoki hujjat (pdf, doc, zip, rar) yuklash mumkin!';
        if (type === 'video')
          msg = 'Faqat video (mp4, mkv, avi, mov) yuklash mumkin!';

        cb(new BadRequestException(msg), false);
      }
    },
  };
};
