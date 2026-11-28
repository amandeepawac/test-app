import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export * from "./auth.js";
export * from "./auth-api.js";
export * from "./admin-api.js";
export * from "./admin-operations-api.js";
export * from "./job-seeker-api.js";
export * from "./employer-api.js";
export * from "./employer-jobs-api.js";
export * from "./public-jobs-api.js";
export * from "./applications-api.js";
export * from "./saved-jobs-api.js";
