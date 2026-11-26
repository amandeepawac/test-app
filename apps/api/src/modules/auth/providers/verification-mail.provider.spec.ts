import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { EmailDeliveryProvider } from '@/infrastructure/mail/email-delivery.provider.js';
import { VerificationMailProvider } from './verification-mail.provider.js';

describe('VerificationMailProvider', () => {
  const settings: Record<string, string> = { WEB_BASE_URL: 'http://localhost:3000' };
  const delivery = { assertReady: vi.fn(), send: vi.fn() };
  let provider: VerificationMailProvider;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        VerificationMailProvider,
        { provide: ConfigService, useValue: { get: (key: string) => settings[key] } },
        { provide: EmailDeliveryProvider, useValue: delivery },
      ],
    }).compile();
    provider = module.get(VerificationMailProvider);
  });

  it('builds a verification email and delegates delivery', async () => {
    await provider.send('user@example.com', 'test-token');

    expect(delivery.send).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Your RozgarLocal account',
      text: expect.stringContaining('http://localhost:3000/verify-email?token=test-token'),
      html: expect.stringContaining('http://localhost:3000/verify-email?token=test-token'),
    });
  });

  it('builds password-reset email content without handling transport', async () => {
    await provider.sendPasswordReset('user@example.com', 'reset-token');

    expect(delivery.send).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Your RozgarLocal password reset',
      text: expect.stringContaining('http://localhost:3000/reset-password?token=reset-token'),
      html: expect.stringContaining('http://localhost:3000/reset-password?token=reset-token'),
    });
  });
});
