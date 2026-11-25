import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

const mailConfigSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  AUTH_MAIL_FROM: z.string().min(1),
  WEB_BASE_URL: z.url().refine((value) => {
    const url = new URL(value);
    return (
      (url.protocol === 'https:' ||
        (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) &&
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash
    );
  }),
});

@Injectable()
export class VerificationMailService {
  private readonly logger = new Logger(VerificationMailService.name);

  constructor(private readonly config: ConfigService) {}

  getSettings() {
    const result = mailConfigSchema.safeParse({
      RESEND_API_KEY: this.config.get('RESEND_API_KEY'),
      AUTH_MAIL_FROM: this.config.get('AUTH_MAIL_FROM'),
      WEB_BASE_URL: this.config.get('WEB_BASE_URL'),
    });
    if (!result.success) {
      this.logger.error('Authentication mail configuration is invalid');
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
    return result.data;
  }

  async send(email: string, token?: string) {
    const settings = this.getSettings();
    const url = new URL('/verify-email', settings.WEB_BASE_URL);
    if (token) url.searchParams.set('token', token);
    const text = token
      ? `Confirm your email address by opening this link: ${url.toString()}\n\nThis link expires in 24 hours.`
      : 'An attempt was made to register this email address. If this was not you, no action is required.';
    let response: Response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: settings.AUTH_MAIL_FROM,
          to: [email],
          subject: 'Your RozgarLocal account',
          text,
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      this.logger.error(
        'Verification email delivery failed',
        error instanceof Error ? error.message : undefined,
      );
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
    if (!response.ok) {
      this.logger.error(`Verification email delivery returned HTTP ${response.status}`);
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
  }
}
