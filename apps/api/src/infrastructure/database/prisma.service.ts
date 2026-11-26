import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@repo/db/generated';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private instance?: PrismaClient;

  constructor(private readonly config: ConfigService) {}

  get client(): PrismaClient {
    if (!this.instance) {
      const connectionString = this.config.getOrThrow<string>('DATABASE_URL');
      this.instance = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    }
    return this.instance;
  }

  async onModuleDestroy() {
    if (this.instance) await this.instance.$disconnect();
  }
}
