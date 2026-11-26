export type LoginAccount = {
  id: string;
  status: string;
  deletedAt: Date | null;
  emailVerifiedAt: Date | null;
  passwordCredential: { passwordHash: string } | null;
};

export type RefreshTokenOwner = {
  sessionId: string;
  userId: string;
};

export abstract class SessionRepository {
  abstract findLoginAccount(email: string): Promise<LoginAccount | null>;

  abstract createLoginSession(input: {
    userId: string;
    passwordHash: string;
    refreshTokenHash: string;
    now: Date;
    expiresAt: Date;
  }): Promise<string | null>;

  abstract findRefreshTokenOwner(tokenHash: string): Promise<RefreshTokenOwner | null>;

  abstract rotateRefreshToken(input: {
    tokenHash: string;
    nextTokenHash: string;
    now: Date;
    owner: RefreshTokenOwner;
  }): Promise<number | null>;

  abstract findCurrentUser(
    userId: string,
    sessionId: string,
    now: Date,
  ): Promise<{
    id: string;
    name: string | null;
    email: string;
    role: 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN';
  } | null>;

  abstract revokeByRefreshToken(tokenHash: string, now: Date): Promise<void>;
}
