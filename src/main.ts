import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './common/filters/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Global Error Handling to prevent server crashes
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Kutilmagan xatolik (Unhandled Rejection):', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Kutilmagan xatolik (Uncaught Exception):', error);
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaExceptionFilter(httpAdapter));

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('ERP System API')
    .setDescription(
      'Zamonaviy ERP Tizimining Backend API hujjatlari. Himoyalangan (qulflangan) endpointlarga kirish uchun yuqoridagi "Authorize" tugmasiga Access Token yozing.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
