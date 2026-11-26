export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export abstract class EmailDeliveryProvider {
  abstract assertReady(): void;
  abstract send(message: EmailMessage): Promise<void>;
}
