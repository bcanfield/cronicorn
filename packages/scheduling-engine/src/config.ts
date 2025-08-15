/**
 * Scheduling Engine Configuration Schema (Zod based)
 * Centralized defaulting + validation (mirrors API env pattern)
 */
import { z } from "zod";

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
export const LoggerSchema = z.any().optional().describe("Injected logger (must implement .info/.error) ");

/** Root engine config (input may be partial) */
export const EngineConfigInputSchema = z.object({
  aiAgent: AIAgentConfigSchema.partial().optional(),
  execution: ExecutionConfigSchema.partial().optional(),
  metrics: MetricsConfigSchema.partial().optional(),
  scheduler: SchedulerConfigSchema.partial().optional(),
  logger: LoggerSchema,
});

/** Fully resolved engine config */
export const EngineConfigSchema = z.object({
  aiAgent: AIAgentConfigSchema,
  execution: ExecutionConfigSchema,
  metrics: MetricsConfigSchema,
  scheduler: SchedulerConfigSchema.optional(),
  logger: LoggerSchema,
});

export type PromptOptimizationConfig = z.infer<typeof PromptOptimizationConfigSchema>;
export type AIAgentConfig = z.infer<typeof AIAgentConfigSchema>;
export type ExecutionConfig = z.infer<typeof ExecutionConfigSchema>;
export type MetricsConfig = z.infer<typeof MetricsConfigSchema>;
export type SchedulerConfig = z.infer<typeof SchedulerConfigSchema>;
export type EngineConfig = z.infer<typeof EngineConfigSchema>;
export type EngineConfigInput = z.infer<typeof EngineConfigInputSchema>;

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
  });
}
