import { z } from "zod";

import type { ExecutionResults, JobContext } from "../../types.js";

/**
 * Classification taxonomy for malformed responses returned by the AI agent.
 * Each category represents a distinct failure pattern that can be surfaced to metrics
 * and (later) drive differentiated repair strategies.
 */
export type MalformedResponseCategory =
  | "schema_parse_error"
  | "semantic_violation"
  | "empty_response"
  | "invalid_enum_value"
  | "structural_inconsistency"
  | "repair_failed"; // reserved for later phases

/** Zod schema for malformed response category */
export const malformedResponseCategorySchema = z.union([
  z.literal("schema_parse_error"),
  z.literal("semantic_violation"),
  z.literal("empty_response"),
  z.literal("invalid_enum_value"),
  z.literal("structural_inconsistency"),
  z.literal("repair_failed"),
]);

/**
 * Metrics hook event union for AI agent phases (plan | schedule).
 * Discriminated by the "type" field.
 */
export type AIAgentMetricsEvent =
  | { type: "malformed"; phase: "plan" | "schedule"; category: MalformedResponseCategory }
  | { type: "repairAttempt"; phase: "plan" | "schedule" }
  | { type: "repairSuccess"; phase: "plan" | "schedule" }
  | { type: "repairFailure"; phase: "plan" | "schedule" };

/** Zod schema for metrics events */
export const aiAgentMetricsEventSchema: z.ZodType<AIAgentMetricsEvent> = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("malformed"),
    phase: z.union([z.literal("plan"), z.literal("schedule")]),
    category: malformedResponseCategorySchema,
  }),
  z.object({
    type: z.literal("repairAttempt"),
    phase: z.union([z.literal("plan"), z.literal("schedule")]),
  }),
  z.object({
    type: z.literal("repairSuccess"),
    phase: z.union([z.literal("plan"), z.literal("schedule")]),
  }),
  z.object({
    type: z.literal("repairFailure"),
    phase: z.union([z.literal("plan"), z.literal("schedule")]),
  }),
]);

// Backwards compatibility alias (tests previously used MetricsEvent)
export type MetricsEvent = AIAgentMetricsEvent;

/** Token usage information reported by upstream LLM provider */
export type TokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
};

/** Planning phase response from the AI agent */
export type AIAgentPlanResponse = {
  endpointsToCall: Array<{
    endpointId: string;
    parameters?: Record<string, unknown>;
    headers?: Record<string, string>;
    priority: number;
    dependsOn?: string[];
    critical: boolean;
  }>;
  executionStrategy: "sequential" | "parallel" | "mixed";
  concurrencyLimit?: number;
  preliminaryNextRunAt?: string;
  reasoning: string;
  confidence: number;
  usage?: TokenUsage;
};

/** Scheduling phase response from the AI agent */
export type AIAgentScheduleResponse = {
  nextRunAt: string;
  reasoning: string;
  confidence: number;
  recommendedActions?: Array<{
    type: "retry_failed_endpoints" | "pause_job" | "modify_frequency" | "notify_user" | "adjust_timeout";
    details: string;
    priority: "low" | "medium" | "high";
  }>;
  usage?: TokenUsage;
};

/** AI Agent service interface */
export type AIAgentService = {
  planExecution: (jobContext: JobContext) => Promise<AIAgentPlanResponse>;
  finalizeSchedule: (
    jobContext: JobContext,
    executionResults: ExecutionResults
  ) => Promise<AIAgentScheduleResponse>;
};

/** Metadata for malformed response persistence hooks */
export type MalformedResponseMetadata = {
  phase: "plan" | "schedule";
  jobId: string;
  category: MalformedResponseCategory;
  attempts: number; // number of repair attempts performed
  repaired: boolean; // whether a repair eventually succeeded
};
