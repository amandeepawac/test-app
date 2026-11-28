import { Injectable } from '@nestjs/common';
import type { CreateApplication, UpdateApplicationStatus } from '@repo/contracts';
import { mapApplicationErrors } from '@/modules/applications/application-errors.js';
import { ApplicationRepository } from '@/modules/applications/application.repository.js';

@Injectable()
export class ApplicationService {
  constructor(private readonly applications: ApplicationRepository) {}

  apply(userId: string, jobId: string, input: CreateApplication) {
    return mapApplicationErrors(() => this.applications.apply(userId, jobId, input));
  }

  listForSeeker(userId: string, page: number, pageSize: number) {
    return mapApplicationErrors(() =>
      this.applications.listForSeeker(userId, page, pageSize),
    );
  }

  withdraw(userId: string, applicationId: string) {
    return mapApplicationErrors(() => this.applications.withdraw(userId, applicationId));
  }

  listForEmployer(userId: string, jobId: string, page: number, pageSize: number) {
    return mapApplicationErrors(() =>
      this.applications.listForEmployer(userId, jobId, page, pageSize),
    );
  }

  updateStatus(userId: string, applicationId: string, input: UpdateApplicationStatus) {
    return mapApplicationErrors(() =>
      this.applications.updateStatus(userId, applicationId, input),
    );
  }
}
