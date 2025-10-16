import { Injectable, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis({
      host: '127.0.0.1',
      port: 6379,
    });
  }

  async set(key: string, value: string, expiresInSeconds: number) {
    await this.client.set(key, value, 'EX', expiresInSeconds);
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    await this.client.del(key);
  }
}
