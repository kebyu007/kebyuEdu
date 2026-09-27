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
    // Suppress the pg driver DeprecationWarning about concurrent queries
    const originalEmitWarning = process.emitWarning;
    // @ts-ignore
    process.emitWarning = function(warning: any, type?: any, code?: any, ...args: any[]) {
      if (type === 'DeprecationWarning' && typeof warning === 'string' && warning.includes('client.query()')) {
        return;
      }
      return originalEmitWarning.call(process, warning, type, code, ...args);
    };

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
