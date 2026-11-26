import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module.js';
import { AuthModule } from '@/modules/auth/auth.module.js';
import { EmployerProfileController } from '@/modules/employers/employer-profile.controller.js';
import { EmployerAuthGuard } from '@/modules/employers/guards/employer-auth.guard.js';
import { EmployerProfileRepository } from '@/modules/employers/repositories/employer-profile.repository.js';
import { PrismaEmployerProfileRepository } from '@/modules/employers/repositories/prisma-employer-profile.repository.js';
import { EmployerProfileService } from '@/modules/employers/services/employer-profile.service.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EmployerProfileController],
  providers: [
    EmployerAuthGuard,
    EmployerProfileService,
    { provide: EmployerProfileRepository, useClass: PrismaEmployerProfileRepository },
  ],
})
export class EmployersModule {}
