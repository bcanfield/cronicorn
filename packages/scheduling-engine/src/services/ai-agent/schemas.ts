import { z } from "zod";

export const executionPlanSchema = z.object({
  endpointsToCall: z.array(
    z.object({
      endpointId: z.string(),
      parameters: z.record(z.unknown()).optional(),
      headers: z.record(z.string()).optional(),
      priority: z.number(),
      dependsOn: z.array(z.string()).optional(),
      critical: z.boolean(),
    }),
  ),
  executionStrategy: z.enum(["sequential", "parallel", "mixed"]),
  concurrencyLimit: z.number().optional(),
  preliminaryNextRunAt: z.string().optional(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

export const schedulingResponseSchema = z.object({
  nextRunAt: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  recommendedActions: z.array(
    z.object({
      type: z.enum([
        "retry_failed_endpoints",
        "pause_job",
        "modify_frequency",
        "notify_user",
        "adjust_timeout",
      ]),
      details: z.string(),
      priority: z.enum(["low", "medium", "high"]),
    }),
  ).optional(),
});
