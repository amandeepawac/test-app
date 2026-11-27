import type { GoogleAuthRequest } from '@repo/contracts';

export type GoogleIdentity = { subject: string; email: string; name: string | null };
export type GoogleAuthMode = Pick<GoogleAuthRequest, 'mode'> & { role?: 'JOB_SEEKER' | 'EMPLOYER' };

export abstract class GoogleAuthRepository {
  abstract authenticate(input: {
    identity: GoogleIdentity;
    intent: GoogleAuthMode;
    linkSession?: { userId: string; sessionId: string };
    refreshTokenHash: string;
    now: Date;
    expiresAt: Date;
  }): Promise<{ userId: string; sessionId: string } | null>;
}
