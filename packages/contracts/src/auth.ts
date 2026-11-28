import { z } from "zod";
import { strongPasswordSchema } from "./password.js";

// Messages are translation keys so consumers can localize validation errors.
const email = z.string().min(1, "emailRequired").email("emailInvalid");
const password = z.string().min(1, "passwordRequired");
const confirmPassword = z.string().min(1, "confirmRequired");

export const loginFormSchema = z.object({ email, password });

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(1, "nameRequired").max(200, "nameTooLong"),
    email: email.max(254, "emailInvalid"),
    password: strongPasswordSchema,
    confirmPassword,
    role: z.enum(["JOB_SEEKER", "EMPLOYER"], { error: "roleRequired" }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordsMismatch",
  });

export const forgotPasswordFormSchema = z.object({ email });

export const resetPasswordFormSchema = z
  .object({ password: strongPasswordSchema, confirmPassword })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordsMismatch",
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
