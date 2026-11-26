import { z } from "zod";

export const phoneNumberSchema = z
  .string()
  .trim()
  .max(20)
  .regex(/^\+?[0-9][0-9 ()-]*$/)
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }, "Phone number must contain 7 to 15 digits");
