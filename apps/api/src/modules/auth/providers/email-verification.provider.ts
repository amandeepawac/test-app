import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthAccountRepository } from '@/modules/auth/repositories/auth-account.repository.js';
import { TokenProvider } from './token.provider.js';

@Injectable()
export class EmailVerificationProvider {
  constructor(
    private readonly accounts: AuthAccountRepository,
    private readonly tokens: TokenProvider,
  ) {}

  async verify(token: string): Promise<void> {
    const isVerified = await this.accounts.verifyEmailToken(this.tokens.hash(token), new Date());
    if (!isVerified) throw new BadRequestException('Invalid or expired verification link');
  }
}
