import type { EmployerProfileResponse, EmployerProfileUpdate } from '@repo/contracts';

export abstract class EmployerProfileRepository {
  abstract findByUserId(userId: string): Promise<EmployerProfileResponse | null>;
  abstract save(userId: string, input: EmployerProfileUpdate): Promise<EmployerProfileResponse>;
  abstract complete(userId: string): Promise<EmployerProfileResponse>;
}
