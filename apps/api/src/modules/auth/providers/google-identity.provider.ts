import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import type { GoogleAuthRequest } from '@repo/contracts';
import type { GoogleIdentity } from '../repositories/google-auth.repository.js';

@Injectable()
export class GoogleIdentityProvider {
  private readonly logger = new Logger(GoogleIdentityProvider.name);
  constructor(private readonly config: ConfigService) {}

  async verify(input: GoogleAuthRequest): Promise<GoogleIdentity> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const secret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const callback = this.config.get<string>('GOOGLE_CALLBACK_URL');
    if (!clientId || !secret || !callback || !z.url().safeParse(callback).success) {
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
    const client = new OAuth2Client({ clientId, clientSecret: secret, redirectUri: callback });
    let idToken: string | null | undefined;
    try {
      const { tokens } = await client.getToken({
        code: input.code,
        codeVerifier: input.codeVerifier,
        redirect_uri: callback,
      });
      idToken = tokens.id_token;
    } catch (error) {
      const response = z
        .object({
          response: z.object({
            status: z.number(),
            data: z.object({ error: z.string().optional() }).optional(),
          }),
        })
        .safeParse(error);
      if (
        response.success &&
        response.data.response.status === 400 &&
        response.data.response.data?.error !== 'invalid_client' &&
        response.data.response.data?.error !== 'unauthorized_client'
      ) {
        throw new UnauthorizedException('Google authentication failed');
      }
      this.logger.warn('Google token exchange unavailable');
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
    if (!idToken) throw new UnauthorizedException('Google authentication failed');
    try {
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload();
      const email = z
        .email()
        .max(254)
        .safeParse(payload?.email?.trim().normalize('NFC').toLowerCase());
      if (
        !payload?.sub ||
        payload.email_verified !== true ||
        payload.nonce !== input.nonce ||
        !email.success
      ) {
        throw new UnauthorizedException('Google authentication failed');
      }
      return {
        subject: payload.sub,
        email: email.data,
        name: payload.name?.trim().slice(0, 200) || null,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'GaxiosError') {
        this.logger.warn('Google token verification unavailable');
        throw new ServiceUnavailableException('Authentication is temporarily unavailable');
      }
      if (!(error instanceof UnauthorizedException)) {
        this.logger.warn('Google token exchange or verification failed');
      }
      throw new UnauthorizedException('Google authentication failed');
    }
  }
}
