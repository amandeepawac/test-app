import type {
  CreateApplication,
  EmployerApplicationListResponse,
  SeekerApplicationListResponse,
  UpdateApplicationStatus,
} from '@repo/contracts';

export abstract class ApplicationRepository {
  abstract apply(
    userId: string,
    jobId: string,
    input: CreateApplication,
  ): Promise<{ id: string; status: 'APPLIED'; appliedAt: string }>;
  abstract listForSeeker(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<SeekerApplicationListResponse>;
  abstract withdraw(
    userId: string,
    applicationId: string,
  ): Promise<{ id: string; status: 'WITHDRAWN'; appliedAt: string }>;
  abstract listForEmployer(
    userId: string,
    jobId: string,
    page: number,
    pageSize: number,
  ): Promise<EmployerApplicationListResponse>;
  abstract updateStatus(
    userId: string,
    applicationId: string,
    input: UpdateApplicationStatus,
  ): Promise<{ id: string; status: UpdateApplicationStatus['status']; appliedAt: string }>;
}
