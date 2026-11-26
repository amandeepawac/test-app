export type RegistrationAccount = {
  id: string;
  emailVerifiedAt: Date | null;
  status: string;
};

export abstract class AuthAccountRepository {
  abstract findOrCreateRegistrationAccount(input: {
    email: string;
    name: string;
    passwordHash: string;
    role: 'JOB_SEEKER' | 'EMPLOYER';
  }): Promise<RegistrationAccount>;

  abstract createVerificationToken(input: {
    userId: string;
    tokenHash: string;
    pendingPasswordHash: string;
    expiresAt: Date;
  }): Promise<void>;

  abstract verifyEmailToken(tokenHash: string, now: Date): Promise<boolean>;
}
