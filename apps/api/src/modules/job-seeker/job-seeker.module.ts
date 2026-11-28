import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module.js';
import { AuthModule } from '@/modules/auth/auth.module.js';
import { JobSeekerAuthGuard } from '@/modules/job-seeker/guards/job-seeker-auth.guard.js';
import { JobSeekerProfileController } from '@/modules/job-seeker/job-seeker-profile.controller.js';
import { JobSeekerProfileRepository } from '@/modules/job-seeker/repositories/job-seeker-profile.repository.js';
import { PrismaJobSeekerProfileRepository } from '@/modules/job-seeker/repositories/prisma-job-seeker-profile.repository.js';
import { JobSeekerProfileService } from '@/modules/job-seeker/services/job-seeker-profile.service.js';
import { ApplicationsModule } from '@/modules/applications/applications.module.js';
import { SavedJobsRepository } from '@/modules/job-seeker/repositories/saved-jobs.repository.js';
import { PrismaSavedJobsRepository } from '@/modules/job-seeker/repositories/prisma-saved-jobs.repository.js';
import { SavedJobsService } from '@/modules/job-seeker/services/saved-jobs.service.js';

@Module({
  imports: [DatabaseModule, AuthModule, ApplicationsModule],
  controllers: [JobSeekerProfileController],
  providers: [
    JobSeekerAuthGuard,
    JobSeekerProfileService,
    SavedJobsService,
    { provide: JobSeekerProfileRepository, useClass: PrismaJobSeekerProfileRepository },
    { provide: SavedJobsRepository, useClass: PrismaSavedJobsRepository },
  ],
})
export class JobSeekerModule {}
