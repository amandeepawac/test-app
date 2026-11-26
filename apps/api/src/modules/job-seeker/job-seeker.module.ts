import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module.js';
import { AuthModule } from '@/modules/auth/auth.module.js';
import { JobSeekerAuthGuard } from '@/modules/job-seeker/guards/job-seeker-auth.guard.js';
import { JobSeekerProfileController } from '@/modules/job-seeker/job-seeker-profile.controller.js';
import { JobSeekerProfileRepository } from '@/modules/job-seeker/repositories/job-seeker-profile.repository.js';
import { PrismaJobSeekerProfileRepository } from '@/modules/job-seeker/repositories/prisma-job-seeker-profile.repository.js';
import { JobSeekerProfileService } from '@/modules/job-seeker/services/job-seeker-profile.service.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [JobSeekerProfileController],
  providers: [
    JobSeekerAuthGuard,
    JobSeekerProfileService,
    { provide: JobSeekerProfileRepository, useClass: PrismaJobSeekerProfileRepository },
  ],
})
export class JobSeekerModule {}
