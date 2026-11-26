export abstract class PasswordRecoveryRepository {
  abstract findEligibleAccount(email: string): Promise<{ id: string } | null>;

  abstract createResetToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;

  abstract resetPassword(input: {
    tokenHash: string;
    passwordHash: string;
    now: Date;
  }): Promise<boolean>;
}
