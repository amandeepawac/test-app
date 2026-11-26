import type {
  JobSeekerProfileResponse,
  JobSeekerProfileUpdate,
  JobSeekerSkillsQuery,
  JobSeekerSkillsResponse,
} from '@repo/contracts';

export abstract class JobSeekerProfileRepository {
  abstract findByUserId(userId: string): Promise<JobSeekerProfileResponse | null>;
  abstract save(userId: string, input: JobSeekerProfileUpdate): Promise<JobSeekerProfileResponse>;
  abstract complete(userId: string): Promise<JobSeekerProfileResponse>;
  abstract listSkills(query: JobSeekerSkillsQuery): Promise<JobSeekerSkillsResponse>;
}
