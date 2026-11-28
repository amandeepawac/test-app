import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module.js';
import { PrivateDocumentStorage } from '@/infrastructure/storage/private-document-storage.js';
import { AdminController } from '@/modules/admin/admin.controller.js';
import { AuditLogAdminController } from '@/modules/admin/audit-log-admin.controller.js';
import { EmployerVerificationAdminController } from '@/modules/admin/employer-verification-admin.controller.js';
import { AdminAuthGuard } from '@/modules/admin/guards/admin-auth.guard.js';
import { JobModerationAdminController } from '@/modules/admin/job-moderation-admin.controller.js';
import { ReportReviewAdminController } from '@/modules/admin/report-review-admin.controller.js';
import { AuditLogRepository } from '@/modules/admin/repositories/audit-log.repository.js';
import { AdminDashboardRepository } from '@/modules/admin/repositories/admin-dashboard.repository.js';
import { EmployerVerificationRepository } from '@/modules/admin/repositories/employer-verification.repository.js';
import { JobModerationRepository } from '@/modules/admin/repositories/job-moderation.repository.js';
import { ReportReviewRepository } from '@/modules/admin/repositories/report-review.repository.js';
import { PrismaAuditLogRepository } from '@/modules/admin/repositories/prisma-audit-log.repository.js';
import { PrismaAdminDashboardRepository } from '@/modules/admin/repositories/prisma-admin-dashboard.repository.js';
import { PrismaEmployerVerificationRepository } from '@/modules/admin/repositories/prisma-employer-verification.repository.js';
import { PrismaJobModerationRepository } from '@/modules/admin/repositories/prisma-job-moderation.repository.js';
import { PrismaReportReviewRepository } from '@/modules/admin/repositories/prisma-report-review.repository.js';
import { AuditLogAdminService } from '@/modules/admin/services/audit-log-admin.service.js';
import { AdminDashboardService } from '@/modules/admin/services/admin-dashboard.service.js';
import { EmployerVerificationAdminService } from '@/modules/admin/services/employer-verification-admin.service.js';
import { JobModerationAdminService } from '@/modules/admin/services/job-moderation-admin.service.js';
import { ReportReviewAdminService } from '@/modules/admin/services/report-review-admin.service.js';
import { AuthModule } from '@/modules/auth/auth.module.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    AdminController,
    EmployerVerificationAdminController,
    JobModerationAdminController,
    ReportReviewAdminController,
    AuditLogAdminController,
  ],
  providers: [
    AdminAuthGuard,
    PrivateDocumentStorage,
    AdminDashboardService,
    EmployerVerificationAdminService,
    JobModerationAdminService,
    ReportReviewAdminService,
    AuditLogAdminService,
    { provide: AdminDashboardRepository, useClass: PrismaAdminDashboardRepository },
    { provide: EmployerVerificationRepository, useClass: PrismaEmployerVerificationRepository },
    { provide: JobModerationRepository, useClass: PrismaJobModerationRepository },
    { provide: ReportReviewRepository, useClass: PrismaReportReviewRepository },
    { provide: AuditLogRepository, useClass: PrismaAuditLogRepository },
  ],
})
export class AdminModule {}
