import { z } from "zod";

export const registrationRequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(200),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.normalize("NFC").toLowerCase()),
  password: z.string().min(8).max(128),
});

export const verifyEmailRequestSchema = z.strictObject({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});

export type RegistrationRequest = z.infer<typeof registrationRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
