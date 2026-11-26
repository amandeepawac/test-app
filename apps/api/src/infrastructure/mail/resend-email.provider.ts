import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { EmailDeliveryProvider, type EmailMessage } from './email-delivery.provider.js';

const resendConfigSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  AUTH_MAIL_FROM: z.string().min(1),
});

@Injectable()
export class ResendEmailProvider extends EmailDeliveryProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  assertReady(): void {
    this.getSettings();
  }

  async send(message: EmailMessage): Promise<void> {
    const settings = this.getSettings();
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
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      this.logger.error(
        'Email delivery failed',
        error instanceof Error ? error.message : undefined,
      );
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }

    if (!response.ok) {
      this.logger.error(`Email delivery returned HTTP ${response.status}`);
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
  }

  private getSettings() {
    const result = resendConfigSchema.safeParse({
      RESEND_API_KEY: this.config.get('RESEND_API_KEY'),
      AUTH_MAIL_FROM: this.config.get('AUTH_MAIL_FROM'),
    });
    if (!result.success) {
      this.logger.error('Email provider configuration is invalid');
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
    return result.data;
  }
}
