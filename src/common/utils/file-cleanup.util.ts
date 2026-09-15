import * as fs from 'fs';
import * as path from 'path';

export const deleteFile = (filePath: string) => {
  if (!filePath) return;

  // Asosiy papkadan tashqari joylarga hujum bo'lmasligi uchun xavfsizlik
  const fullPath = path.resolve(filePath);

  fs.unlink(fullPath, (err) => {
    if (err) {
      console.error(
        `Faylni o'chirishda xatolik yuz berdi: ${fullPath}`,
        err.message,
      );
    } else {
      console.log(`Fayl muvaffaqiyatli o'chirildi: ${fullPath}`);
    }
  });
};
