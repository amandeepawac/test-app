import { Injectable, NotFoundException } from '@nestjs/common';
import type { JobSeekerProfileUpdate, JobSeekerSkillsQuery } from '@repo/contracts';
import { mapJobSeekerRepositoryErrors } from '@/modules/job-seeker/job-seeker-errors.js';
import { JobSeekerProfileRepository } from '@/modules/job-seeker/repositories/job-seeker-profile.repository.js';

@Injectable()
export class JobSeekerProfileService {
  constructor(private readonly profiles: JobSeekerProfileRepository) {}

  listSkills(query: JobSeekerSkillsQuery) {
    return this.profiles.listSkills(query);
  }

  async findByUserId(userId: string) {
    const profile = await this.profiles.findByUserId(userId);
    if (!profile) throw new NotFoundException('Job seeker profile not found');
    return profile;
  }

  save(userId: string, input: JobSeekerProfileUpdate) {
    return mapJobSeekerRepositoryErrors(() => this.profiles.save(userId, input));
  }

  complete(userId: string) {
    return mapJobSeekerRepositoryErrors(() => this.profiles.complete(userId));
  }
}
