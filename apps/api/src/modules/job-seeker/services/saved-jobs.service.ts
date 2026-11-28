import { Injectable } from '@nestjs/common';
import type { SavedJobsQuery } from '@repo/contracts';
import { mapJobSeekerRepositoryErrors } from '@/modules/job-seeker/job-seeker-errors.js';
import { SavedJobsRepository } from '@/modules/job-seeker/repositories/saved-jobs.repository.js';

@Injectable()
export class SavedJobsService {
  constructor(private readonly savedJobs: SavedJobsRepository) {}

  save(userId: string, jobId: string) {
    return mapJobSeekerRepositoryErrors(() => this.savedJobs.save(userId, jobId));
  }

  remove(userId: string, jobId: string) {
    return this.savedJobs.remove(userId, jobId);
  }

  findState(userId: string, jobId: string) {
    return this.savedJobs.findState(userId, jobId);
  }

  list(userId: string, query: SavedJobsQuery) {
    return this.savedJobs.list(userId, query);
  }
}
