import { z } from "zod";

export const strongPasswordSchema = z
  .string()
  .min(1, "passwordRequired")
  .min(8, "passwordTooShort")
  .max(128, "passwordTooLong")
  .regex(
    /(?=.*\p{L})(?=.*\p{N})(?=.*[^\p{L}\p{N}\s])/u,
    "passwordRequirements",
  );
