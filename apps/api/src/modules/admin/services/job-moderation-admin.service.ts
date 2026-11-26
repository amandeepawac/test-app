import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AdminJobModerationDecision,
  AdminJobModerationQuery,
} from '@repo/contracts';
import type { AdminActionContext } from '@/modules/admin/admin-context.js';
import { mapAdminRepositoryErrors } from '@/modules/admin/admin-errors.js';
import { JobModerationRepository } from '@/modules/admin/repositories/job-moderation.repository.js';

@Injectable()
export class JobModerationAdminService {
  constructor(private readonly jobs: JobModerationRepository) {}

  list(query: AdminJobModerationQuery) {
    return this.jobs.list(query);
  }

  async findById(id: string) {
    const job = await this.jobs.findById(id);
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  moderate(id: string, input: AdminJobModerationDecision, context: AdminActionContext) {
    return mapAdminRepositoryErrors(() => this.jobs.moderate(id, input, context));
  }
}
