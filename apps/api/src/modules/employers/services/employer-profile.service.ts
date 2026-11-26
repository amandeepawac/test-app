import { Injectable, NotFoundException } from '@nestjs/common';
import type { EmployerProfileUpdate } from '@repo/contracts';
import { mapEmployerRepositoryErrors } from '@/modules/employers/employer-errors.js';
import { EmployerProfileRepository } from '@/modules/employers/repositories/employer-profile.repository.js';

@Injectable()
export class EmployerProfileService {
  constructor(private readonly profiles: EmployerProfileRepository) {}

  async findByUserId(userId: string) {
    const profile = await this.profiles.findByUserId(userId);
    if (!profile) throw new NotFoundException('Employer profile not found');
    return profile;
  }

  async verification(userId: string) {
    const profile = await this.findByUserId(userId);
    return profile.verification;
  }

  save(userId: string, input: EmployerProfileUpdate) {
    return mapEmployerRepositoryErrors(() => this.profiles.save(userId, input));
  }

  complete(userId: string) {
    return mapEmployerRepositoryErrors(() => this.profiles.complete(userId));
  }
}
