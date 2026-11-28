import { Injectable, NotFoundException } from '@nestjs/common';
import type { PublicJobsQuery } from '@repo/contracts';
import { PublicJobsRepository } from '@/modules/employers/repositories/public-jobs.repository.js';

@Injectable()
export class PublicJobsService {
  constructor(private readonly jobs: PublicJobsRepository) {}

  list(query: PublicJobsQuery) {
    return this.jobs.list(query);
  }

  async findById(id: string) {
    try {
      return await this.jobs.findById(id);
    } catch (error) {
      throw error instanceof Error && error.message === 'PUBLIC_JOB_NOT_FOUND'
        ? new NotFoundException('Job not found')
        : error;
    }
  }

  categories() {
    return this.jobs.categories();
  }
}
