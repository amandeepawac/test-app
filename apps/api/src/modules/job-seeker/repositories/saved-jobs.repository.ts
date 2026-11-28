import type { SavedJobListResponse, SavedJobState, SavedJobsQuery } from '@repo/contracts';

export abstract class SavedJobsRepository {
  abstract save(userId: string, jobId: string): Promise<SavedJobState>;
  abstract remove(userId: string, jobId: string): Promise<SavedJobState>;
  abstract findState(userId: string, jobId: string): Promise<SavedJobState>;
  abstract list(userId: string, query: SavedJobsQuery): Promise<SavedJobListResponse>;
}
