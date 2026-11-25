import { z } from "zod";

// Messages are translation keys so consumers can localize validation errors.
const email = z
  .string()
  .min(1, "emailRequired")
  .email("emailInvalid");
const password = z.string().min(1, "passwordRequired");
const confirmPassword = z.string().min(1, "confirmRequired");

export const loginFormSchema = z.object({ email, password });

export const registerFormSchema = z
  .object({
    name: z.string().refine((value) => value.trim().length > 0, "nameRequired"),
    email,
    password,
    confirmPassword,
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordsMismatch",
  });

export const forgotPasswordFormSchema = z.object({ email });

export const resetPasswordFormSchema = z
  .object({ password, confirmPassword })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordsMismatch",
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
