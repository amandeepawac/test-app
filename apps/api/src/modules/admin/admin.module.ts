import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module.js';
import { AdminController } from '@/modules/admin/admin.controller.js';
import { AdminAuthGuard } from '@/modules/admin/guards/admin-auth.guard.js';
import { AdminDashboardRepository } from '@/modules/admin/repositories/admin-dashboard.repository.js';
import { PrismaAdminDashboardRepository } from '@/modules/admin/repositories/prisma-admin-dashboard.repository.js';
import { AdminDashboardService } from '@/modules/admin/services/admin-dashboard.service.js';
import { AuthModule } from '@/modules/auth/auth.module.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AdminController],
  providers: [
    AdminAuthGuard,
    AdminDashboardService,
    { provide: AdminDashboardRepository, useClass: PrismaAdminDashboardRepository },
  ],
})
export class AdminModule {}
