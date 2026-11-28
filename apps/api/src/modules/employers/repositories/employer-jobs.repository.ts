import type {
  EmployerJobCreate,
  EmployerJobListResponse,
  EmployerJobResponse,
  EmployerJobsQuery,
  EmployerJobUpdate,
} from '@repo/contracts';

export abstract class EmployerJobsRepository {
  abstract create(userId: string, input: EmployerJobCreate): Promise<EmployerJobResponse>;
  abstract list(userId: string, query: EmployerJobsQuery): Promise<EmployerJobListResponse>;
  abstract findById(userId: string, id: string): Promise<EmployerJobResponse>;
  abstract update(
    userId: string,
    id: string,
    input: EmployerJobUpdate,
  ): Promise<EmployerJobResponse>;
  abstract transition(
    userId: string,
    id: string,
    action: 'publish' | 'pause',
  ): Promise<EmployerJobResponse>;
}
