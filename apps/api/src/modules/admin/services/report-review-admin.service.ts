import { Injectable, NotFoundException } from '@nestjs/common';
import type { AdminReportQuery, AdminReportUpdate } from '@repo/contracts';
import type { AdminActionContext } from '@/modules/admin/admin-context.js';
import { mapAdminRepositoryErrors } from '@/modules/admin/admin-errors.js';
import { ReportReviewRepository } from '@/modules/admin/repositories/report-review.repository.js';

@Injectable()
export class ReportReviewAdminService {
  constructor(private readonly reports: ReportReviewRepository) {}

  list(query: AdminReportQuery) {
    return this.reports.list(query);
  }

  async findById(id: string) {
    const report = await this.reports.findById(id);
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  update(id: string, input: AdminReportUpdate, context: AdminActionContext) {
    return mapAdminRepositoryErrors(() => this.reports.update(id, input, context));
  }
}
