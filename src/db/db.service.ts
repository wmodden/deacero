import { Global, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Global()
@Injectable()
export class DbService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // Note: this is optional
    await this.$connect();
  }
}
