import { Module } from '@nestjs/common';
import { EmailDeliveryProvider } from './email-delivery.provider.js';
import { ResendEmailProvider } from './resend-email.provider.js';

@Module({
  providers: [
    ResendEmailProvider,
    { provide: EmailDeliveryProvider, useExisting: ResendEmailProvider },
  ],
  exports: [EmailDeliveryProvider],
})
export class MailModule {}
