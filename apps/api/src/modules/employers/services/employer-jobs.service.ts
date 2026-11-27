import { Injectable } from '@nestjs/common';
import type { EmployerJobCreate, EmployerJobsQuery, EmployerJobUpdate } from '@repo/contracts';
import { mapEmployerJobErrors } from '@/modules/employers/employer-jobs-errors.js';
import { EmployerJobsRepository } from '@/modules/employers/repositories/employer-jobs.repository.js';

@Injectable()
export class EmployerJobsService {
  constructor(private readonly jobs: EmployerJobsRepository) {}

  create(userId: string, input: EmployerJobCreate) {
    return mapEmployerJobErrors(() => this.jobs.create(userId, input));
  }

  list(userId: string, query: EmployerJobsQuery) {
    return mapEmployerJobErrors(() => this.jobs.list(userId, query));
  }

  findById(userId: string, id: string) {
    return mapEmployerJobErrors(() => this.jobs.findById(userId, id));
  }

  update(userId: string, id: string, input: EmployerJobUpdate) {
    return mapEmployerJobErrors(() => this.jobs.update(userId, id, input));
  }

  transition(userId: string, id: string, action: 'publish' | 'pause') {
    return mapEmployerJobErrors(() => this.jobs.transition(userId, id, action));
  }
}
