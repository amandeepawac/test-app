import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { EmailDeliveryProvider } from '@/infrastructure/mail/email-delivery.provider.js';
import {
  createAuthActionEmail,
  createAuthNoticeEmail,
} from '@/infrastructure/mail/templates/auth-email.templates.js';

const webConfigSchema = z.object({
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
export class VerificationMailProvider {
  constructor(
    private readonly config: ConfigService,
    private readonly emailDelivery: EmailDeliveryProvider,
  ) {}

  assertReady(): void {
    this.webBaseUrl();
    this.emailDelivery.assertReady();
  }

  async send(email: string, token?: string): Promise<void> {
    const subject = 'Your RozgarLocal account';
    const content = token
      ? createAuthActionEmail({
          preview: 'Confirm your email address to finish setting up your account.',
          heading: 'Confirm your email',
          message:
            'You are one step away from getting started. Confirm this email address to activate your RozgarLocal account.',
          buttonText: 'Confirm email address',
          actionUrl: this.createActionUrl('/verify-email', token),
          expiry: 'This confirmation link expires in 24 hours.',
          securityNote: 'If you did not create this account, you can ignore this message.',
        })
      : createAuthNoticeEmail({
          preview: 'An attempt was made to register this email address.',
          heading: 'Registration request received',
          message: 'An attempt was made to register this email address with RozgarLocal.',
          securityNote: 'If you did not make this request, no action is needed.',
        });

    await this.emailDelivery.send({ to: email, subject, ...content });
  }

  async sendPasswordReset(email: string, token?: string): Promise<void> {
    const subject = 'Your RozgarLocal password reset';
    const content = token
      ? createAuthActionEmail({
          preview: 'Use the secure link to reset your RozgarLocal password.',
          heading: 'Reset your password',
          message: 'We received a request to reset the password for your RozgarLocal account.',
          buttonText: 'Choose a new password',
          actionUrl: this.createActionUrl('/reset-password', token),
          expiry: 'This password reset link expires in 30 minutes.',
          securityNote:
            'If you did not request a password reset, ignore this message. Your password will stay the same.',
        })
      : createAuthNoticeEmail({
          preview: 'A password reset was requested for this email address.',
          heading: 'Password reset request received',
          message: 'A password reset was requested for this email address.',
          securityNote: 'If you did not make this request, no action is needed.',
        });

    await this.emailDelivery.send({ to: email, subject, ...content });
  }

  private createActionUrl(path: string, token: string): string {
    const url = new URL(path, this.webBaseUrl());
    url.searchParams.set('token', token);
    return url.toString();
  }

  private webBaseUrl(): string {
    const result = webConfigSchema.safeParse({ WEB_BASE_URL: this.config.get('WEB_BASE_URL') });
    if (!result.success) {
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
    return result.data.WEB_BASE_URL;
  }
}
