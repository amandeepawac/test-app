import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module.js';
import { ApplicationRepository } from '@/modules/applications/application.repository.js';
import { ApplicationService } from '@/modules/applications/application.service.js';
import { PrismaApplicationRepository } from '@/modules/applications/prisma-application.repository.js';

@Module({
  imports: [DatabaseModule],
  providers: [
    ApplicationService,
    { provide: ApplicationRepository, useClass: PrismaApplicationRepository },
  ],
  exports: [ApplicationService],
})
export class ApplicationsModule {}
