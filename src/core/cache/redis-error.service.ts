import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisErrorHandlerService implements OnModuleInit {
  private readonly logger = new Logger('RedisClient');

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  onModuleInit() {
    // cache-manager v5+ uses 'stores' array, older versions use 'store'.
    const cache: any = this.cacheManager;
    const store = cache.store || (cache.stores && cache.stores[0]);
    const redisClient = store?.client;

    if (redisClient) {
      redisClient.on('error', (err: any) => {
        this.logger.error(
          `Redis bilan aloqa uzildi yoki xatolik: ${err.message}`,
        );
      });

      redisClient.on('connect', () => {
        this.logger.log('Redisga muvaffaqiyatli ulandi!');
      });

      redisClient.on('reconnecting', () => {
        this.logger.warn('Redisga qayta ulanishga harakat qilinmoqda...');
      });
    }
  }
}
