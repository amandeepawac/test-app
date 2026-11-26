import { Injectable } from '@nestjs/common';
import type { AdminDashboardResponse } from '@repo/contracts';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { AdminDashboardRepository } from './admin-dashboard.repository.js';

@Injectable()
export class PrismaAdminDashboardRepository implements AdminDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<AdminDashboardResponse> {
    const db = this.prisma.client;
    const visibleUser = { deletedAt: null, status: { not: 'DELETED' as const } };
    const [
      totalUsers,
      jobSeekers,
      employers,
      admins,
      suspendedUsers,
      totalJobs,
      publishedJobs,
      pendingJobs,
      pendingVerifications,
      verificationsUnderReview,
      verificationsNeedingInfo,
      openReports,
      reportsUnderReview,
      recentActivity,
    ] = await Promise.all([
      db.user.count({ where: visibleUser }),
      db.user.count({ where: { ...visibleUser, primaryRole: 'JOB_SEEKER' } }),
      db.user.count({ where: { ...visibleUser, primaryRole: 'EMPLOYER' } }),
      db.user.count({ where: { ...visibleUser, primaryRole: 'ADMIN' } }),
      db.user.count({ where: { ...visibleUser, status: 'SUSPENDED' } }),
      db.job.count(),
      db.job.count({ where: { status: 'PUBLISHED' } }),
      db.job.count({ where: { status: 'PENDING_REVIEW' } }),
      db.employerProfile.count({ where: { verificationStatus: 'PENDING' } }),
      db.employerProfile.count({ where: { verificationStatus: 'UNDER_REVIEW' } }),
      db.employerProfile.count({ where: { verificationStatus: 'NEEDS_MORE_INFO' } }),
      db.report.count({ where: { status: 'OPEN' } }),
      db.report.count({ where: { status: 'UNDER_REVIEW' } }),
      db.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
          actor: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        jobSeekers,
        employers,
        admins,
        suspended: suspendedUsers,
      },
      jobs: { total: totalJobs, published: publishedJobs, pendingReview: pendingJobs },
      employerVerifications: {
        pending: pendingVerifications,
        underReview: verificationsUnderReview,
        needsMoreInfo: verificationsNeedingInfo,
      },
      reports: { open: openReports, underReview: reportsUnderReview },
      recentActivity: recentActivity.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  }
}
