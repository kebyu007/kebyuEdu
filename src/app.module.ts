import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { redisStore } from 'cache-manager-redis-yet';
import { UsersModule } from './modules/users/users.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { PrismaModule } from './core/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { validate } from './config/env.validation';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RedisErrorHandlerService } from './core/cache/redis-error.service';
import { StudentsModule } from './modules/students/students.module';
import { CoursesModule } from './modules/courses/courses.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { GroupsModule } from './modules/groups/groups.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { HomeworksModule } from './modules/homeworks/homeworks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
    }),
    NotificationsModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
          socket: {
            reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
          },
        }),
      }),
    }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
    PrismaModule,
    UsersModule,
    TeachersModule,
    AuthModule,
    StudentsModule,
    CoursesModule,
    RoomsModule,
    GroupsModule,
    LessonsModule,
    HomeworksModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    RedisErrorHandlerService,
  ],
})
export class AppModule {}
