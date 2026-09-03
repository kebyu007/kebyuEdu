import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { TeachersModule } from './modules/teachers/teachers.module';

@Module({
  imports: [UsersModule, TeachersModule],
})
export class AppModule {}
