import type {
  PublicJob,
  PublicJobListResponse,
  PublicJobsQuery,
} from '@repo/contracts';

export abstract class PublicJobsRepository {
  abstract list(query: PublicJobsQuery): Promise<PublicJobListResponse>;
  abstract findById(id: string): Promise<PublicJob>;
  abstract categories(): Promise<{
    items: Array<{ id: string; name: string; slug: string }>;
  }>;
}
