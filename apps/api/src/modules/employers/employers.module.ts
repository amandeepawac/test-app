import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module.js';
import { AuthModule } from '@/modules/auth/auth.module.js';
import { EmployerProfileController } from '@/modules/employers/employer-profile.controller.js';
import { EmployerJobsController } from '@/modules/employers/employer-jobs.controller.js';
import { EmployerAuthGuard } from '@/modules/employers/guards/employer-auth.guard.js';
import { EmployerProfileRepository } from '@/modules/employers/repositories/employer-profile.repository.js';
import { PrismaEmployerProfileRepository } from '@/modules/employers/repositories/prisma-employer-profile.repository.js';
import { EmployerProfileService } from '@/modules/employers/services/employer-profile.service.js';
import { EmployerJobsService } from '@/modules/employers/services/employer-jobs.service.js';
import { EmployerJobsRepository } from '@/modules/employers/repositories/employer-jobs.repository.js';
import { PrismaEmployerJobsRepository } from '@/modules/employers/repositories/prisma-employer-jobs.repository.js';
import { PrivateDocumentStorage } from '@/infrastructure/storage/private-document-storage.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EmployerProfileController, EmployerJobsController],
  providers: [
    EmployerAuthGuard,
    PrivateDocumentStorage,
    EmployerProfileService,
    EmployerJobsService,
    { provide: EmployerProfileRepository, useClass: PrismaEmployerProfileRepository },
    { provide: EmployerJobsRepository, useClass: PrismaEmployerJobsRepository },
  ],
})
export class EmployersModule {}
