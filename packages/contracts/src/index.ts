import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export {
  forgotPasswordFormSchema,
  loginFormSchema,
  registerFormSchema,
  resetPasswordFormSchema,
} from "./auth.js";
export type {
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
} from "./auth.js";
export { registrationRequestSchema, verifyEmailRequestSchema } from "./auth-api.js";
export type { RegistrationRequest, VerifyEmailRequest } from "./auth-api.js";
