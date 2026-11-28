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
import { PublicJobsController } from '@/modules/employers/public-jobs.controller.js';
import { PublicJobsService } from '@/modules/employers/services/public-jobs.service.js';
import { PublicJobsRepository } from '@/modules/employers/repositories/public-jobs.repository.js';
import { PrismaPublicJobsRepository } from '@/modules/employers/repositories/prisma-public-jobs.repository.js';
import { ApplicationsModule } from '@/modules/applications/applications.module.js';

@Module({
  imports: [DatabaseModule, AuthModule, ApplicationsModule],
  controllers: [EmployerProfileController, EmployerJobsController, PublicJobsController],
  providers: [
    EmployerAuthGuard,
    PrivateDocumentStorage,
    EmployerProfileService,
    EmployerJobsService,
    PublicJobsService,
    { provide: EmployerProfileRepository, useClass: PrismaEmployerProfileRepository },
    { provide: EmployerJobsRepository, useClass: PrismaEmployerJobsRepository },
    { provide: PublicJobsRepository, useClass: PrismaPublicJobsRepository },
  ],
})
export class EmployersModule {}
