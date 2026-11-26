import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { fileURLToPath } from 'node:url';
import { validateEnvironment } from './validation.js';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: fileURLToPath(new URL('../../../../.env', import.meta.url)),
      validate: validateEnvironment,
    }),
  ],
  exports: [NestConfigModule],
})
export class ApiConfigModule {}
