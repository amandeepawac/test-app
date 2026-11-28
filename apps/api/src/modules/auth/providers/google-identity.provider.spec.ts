import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { GoogleIdentityProvider } from './google-identity.provider.js';

const google = vi.hoisted(() => ({ getToken: vi.fn(), verifyIdToken: vi.fn() }));
vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    getToken = google.getToken;
    verifyIdToken = google.verifyIdToken;
  },
}));

describe('GoogleIdentityProvider', () => {
  const config: Record<string, string> = {
    GOOGLE_CLIENT_ID: 'client',
    GOOGLE_CLIENT_SECRET: 'secret',
    GOOGLE_CALLBACK_URL: 'https://example.com/auth/google/callback',
  };
  const request = {
    mode: 'login' as const,
    code: 'code',
    codeVerifier: 'a'.repeat(43),
    nonce: 'b'.repeat(43),
  };
  let provider: GoogleIdentityProvider;

  beforeEach(async () => {
    vi.resetAllMocks();
    google.getToken.mockResolvedValue({ tokens: { id_token: 'id-token' } });
    google.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'subject',
        email: 'USER@example.com',
        email_verified: true,
        nonce: request.nonce,
        name: 'User',
      }),
    });
    const module = await Test.createTestingModule({
      providers: [
        GoogleIdentityProvider,
        { provide: ConfigService, useValue: { get: (key: string) => config[key] } },
      ],
    }).compile();
    provider = module.get(GoogleIdentityProvider);
  });

  it('exchanges with PKCE and checks the Google token audience and verified email', async () => {
    await expect(provider.verify(request)).resolves.toEqual({
      subject: 'subject',
      email: 'user@example.com',
      name: 'User',
    });
    expect(google.getToken).toHaveBeenCalledWith({
      code: 'code',
      codeVerifier: request.codeVerifier,
      redirect_uri: config.GOOGLE_CALLBACK_URL,
    });
    expect(google.verifyIdToken).toHaveBeenCalledWith({ idToken: 'id-token', audience: 'client' });
  });

  it.each([
    { sub: 'subject', email: 'user@example.com', email_verified: false, nonce: request.nonce },
    { sub: 'subject', email: 'user@example.com', email_verified: true, nonce: 'wrong' },
    { sub: '', email: 'user@example.com', email_verified: true, nonce: request.nonce },
  ])('rejects an invalid identity payload', async (payload) => {
    google.verifyIdToken.mockResolvedValue({ getPayload: () => payload });
    await expect(provider.verify(request)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('fails explicitly when the client is not configured', async () => {
    const secret = config.GOOGLE_CLIENT_SECRET;
    config.GOOGLE_CLIENT_SECRET = '';
    try {
      await expect(provider.verify(request)).rejects.toBeInstanceOf(ServiceUnavailableException);
    } finally {
      config.GOOGLE_CLIENT_SECRET = secret;
    }
  });

  it('distinguishes Google transport failure from a rejected authorization code', async () => {
    google.getToken.mockRejectedValueOnce(new Error('network unavailable'));
    await expect(provider.verify(request)).rejects.toBeInstanceOf(ServiceUnavailableException);
    google.getToken.mockRejectedValueOnce({ response: { status: 400 } });
    await expect(provider.verify(request)).rejects.toBeInstanceOf(UnauthorizedException);
    google.getToken.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'invalid_client' } },
    });
    await expect(provider.verify(request)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
