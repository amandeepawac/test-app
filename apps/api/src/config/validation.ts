import { z } from 'zod';

const environmentSchema = z.object({
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  THROTTLE_TTL: z.coerce.number().int().positive().default(60_000),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(65535))
    .default(3001),
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().trim().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().trim().min(1).optional(),
});

export function validateEnvironment(environment: Record<string, unknown>) {
  const result = environmentSchema.safeParse(environment);
  if (!result.success) {
    throw new Error(`Invalid API configuration: ${z.prettifyError(result.error)}`);
  }
  return { ...environment, ...result.data };
}
