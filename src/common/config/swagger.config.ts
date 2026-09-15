import { DocumentBuilder } from '@nestjs/swagger';
export const config = new DocumentBuilder()
  .setTitle('KebyuEdu')
  .setDescription('API documentation with Superadmin access')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT Superadmin tokenini kiriting',
    },
    'accessToken',
  )
  .build();
