/**
 * Scheduling Engine Configuration Schema (Zod based)
 * Centralized defaulting + validation (mirrors API env pattern)
 */
import { z } from "zod";

import { aiAgentMetricsEventSchema, malformedResponseCategorySchema } from "./services/ai-agent/types.js";

/** Prompt optimization nested config */
export const PromptOptimizationConfigSchema = z.object({
  enabled: z.boolean().default(true).describe("Enable context trimming & relevance limiting"),
  maxMessages: z.number().int().positive().default(10).describe("Maximum total messages passed to planner"),
  minRecentMessages: z.number().int().nonnegative().default(3).describe("Minimum most recent non-system messages always retained"),
  maxEndpointUsageEntries: z.number().int().positive().default(5).describe("Max historical endpoint usage entries included"),
});

/** AI Agent config */
export const AIAgentConfigSchema = z.object({
  model: z.string().default("gpt-4o").describe("AI model identifier"),
  temperature: z.number().min(0).max(1).default(0.2).describe("Sampling temperature"),
  maxRetries: z.number().int().min(0).default(2).describe("Max retry attempts for AI calls"),
  maxPromptTokens: z.number().int().positive().optional().describe("Soft ceiling for prompt token budgeting"),
  streaming: z.boolean().optional().describe("Enable streaming responses (experimental)"),
  promptOptimization: PromptOptimizationConfigSchema.default({}).describe("Prompt optimization controls"),
  validateSemantics: z.boolean().default(true).describe("Enable semantic validation of AI responses"),
  semanticStrict: z.boolean().default(true).describe("Treat semantic issues as errors (true) or warnings (false)"),
  repairMalformedResponses: z.boolean().default(true).describe("Attempt automated repair when AI response is malformed or schema-invalid"),
  maxRepairAttempts: z.number().int().min(1).default(1).describe("Maximum automated repair attempts when repairMalformedResponses is enabled"),
  metricsHook: z
    .function()
    .args(aiAgentMetricsEventSchema)
    .returns(z.void())
    .optional()
    .describe("Internal hook for metrics instrumentation (internal use)"),
  malformedPersistenceHook: z
    .function()
    .args(
      z.object({
        phase: z.union([z.literal("plan"), z.literal("schedule")]),
        jobId: z.string(),
        category: malformedResponseCategorySchema,
        attempts: z.number().int().min(0),
        repaired: z.boolean(),
      }),
    )
    .returns(z.void())
    .optional()
    .describe("Hook to persist malformed response metadata (classification + attempts + repaired flag)"),
});

/** Endpoint execution config */
export const ExecutionConfigSchema = z.object({
  maxConcurrency: z.number().int().positive().default(5).describe("Global max concurrent endpoint executions"),
  defaultConcurrencyLimit: z.number().int().positive().default(3).describe("Default concurrency limit for parallel/mixed plans"),
  defaultTimeoutMs: z.number().int().positive().default(30000).describe("Per-request default timeout in ms"),
  maxEndpointRetries: z.number().int().min(0).default(3).describe("Retries for failed endpoint calls"),
  allowCancellation: z.boolean().default(false).describe("Allow cancellation tokens for in-flight requests"),
  responseContentLengthLimit: z.number().int().positive().default(10000).describe("Max stored response characters before truncation"),
  validateResponseSchemas: z.boolean().default(true).describe("Validate responses against endpoint schema where available"),
  executionPhaseTimeoutMs: z.number().int().positive().optional().describe("Optional global timeout for entire execution phase"),
  circuitBreaker: z.object({
    enabled: z.boolean().default(true),
    failureThreshold: z.number().int().positive().default(5).describe("Failures within window to open circuit"),
    windowMs: z.number().int().positive().default(60000).describe("Rolling window for counting failures"),
    cooldownMs: z.number().int().positive().default(30000).describe("Time to remain open before half-open trial"),
    halfOpenMaxCalls: z.number().int().positive().default(1).describe("Trial calls allowed in half-open state"),
    halfOpenSuccessesToClose: z.number().int().positive().default(1).describe("Successes required to close from half-open"),
    halfOpenFailuresToReopen: z.number().int().positive().default(1).describe("Failures in half-open to re-open immediately"),
  }).default({}),
});

/** Metrics config */
export const MetricsConfigSchema = z.object({
  enabled: z.boolean().default(true).describe("Enable metrics collection"),
  samplingRate: z.number().min(0).max(1).default(1.0).describe("Sampling rate for detailed metrics"),
  trackTokenUsage: z.boolean().default(true).describe("Track AI token usage aggregates"),
});

/** Scheduler config */
export const SchedulerConfigSchema = z.object({
  maxBatchSize: z.number().int().positive().default(20).describe("Max jobs fetched per cycle"),
  processingIntervalMs: z.number().int().positive().default(60000).describe("Interval between automatic cycles (ms)"),
  autoUnlockStaleJobs: z.boolean().default(true).describe("Automatically unlock stale locks before cycle"),
  staleLockThresholdMs: z.number().int().positive().default(300000).describe("Lock age considered stale (ms)"),
  jobProcessingConcurrency: z.number().int().positive().default(1).describe("Concurrent job pipelines per cycle"),
});

/** Logger placeholder */
export const LoggerSchema = z.object({
  info: z.function().args(z.any()).returns(z.void()).optional(),
  debug: z.function().args(z.any()).returns(z.void()).optional(),
  warn: z.function().args(z.any()).returns(z.void()).optional(),
  error: z.function().args(z.any()).returns(z.void()).optional(),
  child: z.function().args(z.any()).returns(z.any()).optional(),
}).passthrough().optional().describe("Injected logger (supports info/debug/warn/error/child)");

/** Events hook schema */
export const EventsConfigSchema = z.object({
  onRetryAttempt: z.function().args(z.object({ jobId: z.string(), endpointId: z.string(), attempt: z.number().int().min(1) })).returns(z.void()).optional(),
  onRetryExhausted: z.function().args(z.object({ jobId: z.string(), endpointId: z.string(), attempts: z.number().int().min(1) })).returns(z.void()).optional(),
  onExecutionProgress: z.function().args(z.object({ jobId: z.string().optional(), completed: z.number().int().nonnegative(), total: z.number().int().nonnegative() })).returns(z.void()).optional(),
  onAbort: z.function().args(z.object({ jobId: z.string().optional(), reason: z.string().optional() })).returns(z.void()).optional(),
  onCircuitStateChange: z.function().args(z.object({ endpointId: z.string(), from: z.enum(["closed", "open", "half_open"]).optional(), to: z.enum(["closed", "open", "half_open"]), failures: z.number().int().nonnegative().optional() })).returns(z.void()).optional(),
  onEndpointProgress: z.function().args(z.object({ jobId: z.string().optional(), endpointId: z.string(), status: z.enum(["pending", "in_progress", "success", "failed"]), attempt: z.number().int().min(0), error: z.string().optional() })).returns(z.void()).optional(),
}).partial();

/** Root engine config (input may be partial) */
export const EngineConfigInputSchema = z.object({
  aiAgent: AIAgentConfigSchema.partial().optional(),
  execution: ExecutionConfigSchema.partial().optional(),
  metrics: MetricsConfigSchema.partial().optional(),
  scheduler: SchedulerConfigSchema.partial().optional(),
  logger: LoggerSchema,
  events: EventsConfigSchema.optional(),
});

/** Fully resolved engine config */
export const EngineConfigSchema = z.object({
  aiAgent: AIAgentConfigSchema,
  execution: ExecutionConfigSchema,
  metrics: MetricsConfigSchema,
  scheduler: SchedulerConfigSchema.optional(),
  logger: LoggerSchema,
  events: EventsConfigSchema.optional(),
});

export type PromptOptimizationConfig = z.infer<typeof PromptOptimizationConfigSchema>;
export type AIAgentConfig = z.infer<typeof AIAgentConfigSchema>;
export type ExecutionConfig = z.infer<typeof ExecutionConfigSchema>;
export type MetricsConfig = z.infer<typeof MetricsConfigSchema>;
export type SchedulerConfig = z.infer<typeof SchedulerConfigSchema>;
export type EngineConfig = z.infer<typeof EngineConfigSchema>;
export type EngineConfigInput = z.infer<typeof EngineConfigInputSchema>;
export type EventsConfig = z.infer<typeof EventsConfigSchema>;

/**
 * Build + validate a full EngineConfig from partial input
 */
export function validateEngineConfig(input: EngineConfigInput): EngineConfig {
  const parsed = EngineConfigInputSchema.parse(input || {});
  const aiAgent = AIAgentConfigSchema.parse(parsed.aiAgent || {});
  const execution = ExecutionConfigSchema.parse(parsed.execution || {});
  const metrics = MetricsConfigSchema.parse(parsed.metrics || {});
  const scheduler = parsed.scheduler ? SchedulerConfigSchema.parse(parsed.scheduler) : SchedulerConfigSchema.parse({});
  return EngineConfigSchema.parse({
    aiAgent,
    execution,
    metrics,
    scheduler,
    logger: parsed.logger,
    events: parsed.events,
  });
}
