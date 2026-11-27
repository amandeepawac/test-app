import { z } from "zod";

const email = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.normalize("NFC").toLowerCase());
const token = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const newPassword = z.string().min(8).max(128);

export const registrationRequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(200),
  email,
  password: newPassword,
  role: z.enum(["JOB_SEEKER", "EMPLOYER"]).optional(),
});

export const verifyEmailRequestSchema = z.strictObject({
  token,
});
export const loginRequestSchema = z.strictObject({
  email,
  password: z.string().min(1).max(128),
});
const googleExchangeFields = {
  code: z.string().min(1).max(4096),
  codeVerifier: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/),
  nonce: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
};
export const googleAuthRequestSchema = z.discriminatedUnion("mode", [
  z.strictObject({ ...googleExchangeFields, mode: z.literal("login") }),
  z.strictObject({
    ...googleExchangeFields,
    mode: z.literal("signup"),
    role: z.enum(["JOB_SEEKER", "EMPLOYER"]),
  }),
  z.strictObject({ ...googleExchangeFields, mode: z.literal("link") }),
]);
export type GoogleAuthRequest = z.infer<typeof googleAuthRequestSchema>;
export const forgotPasswordRequestSchema = z.strictObject({ email });
export const resetPasswordRequestSchema = z.strictObject({
  token,
  password: newPassword,
});
export const refreshRequestSchema = z.strictObject({ refreshToken: token });
export const sessionResponseSchema = z.strictObject({
  accessToken: z.string().min(1),
  refreshToken: token,
  accessExpiresIn: z.number().int().positive(),
  refreshExpiresIn: z.number().int().positive(),
});
export const currentUserResponseSchema = z.strictObject({
  id: z.uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(["JOB_SEEKER", "EMPLOYER", "ADMIN"]),
});

export type RegistrationRequest = z.infer<typeof registrationRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
