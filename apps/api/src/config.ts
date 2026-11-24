import { z } from 'zod';

const environmentSchema = z.object({
  PORT: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(65535))
    .default(3001),
});

export function validateEnvironment(environment: Record<string, unknown>) {
  const result = environmentSchema.safeParse(environment);
  if (!result.success) {
    throw new Error(`Invalid API configuration: ${z.prettifyError(result.error)}`);
  }
  return { ...environment, ...result.data };
}
