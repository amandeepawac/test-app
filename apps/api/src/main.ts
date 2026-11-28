import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });
  app.useBodyParser('json', { limit: '8mb' });
  const config = app.get(ConfigService);
  await app.listen(config.getOrThrow<number>('PORT'));
}
await bootstrap();
