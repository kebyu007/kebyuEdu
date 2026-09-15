import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const pool = new Pool({ connectionString: process.env.PRISMA_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter, log: ['error', 'warn'] });
  }

  async onModuleInit() {
    Logger.log('✅ Database connected');
  }

  async onModuleDestroy() {
    Logger.log('❌ Database disconnected');
  }
}
