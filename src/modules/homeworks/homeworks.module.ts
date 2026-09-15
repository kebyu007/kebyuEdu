import { Module } from '@nestjs/common';
import { HomeworksController } from './homeworks.controller';
import { HomeworksService } from './homeworks.service';

@Module({
  controllers: [HomeworksController],
  providers: [HomeworksService],
})
export class HomeworksModule {}
