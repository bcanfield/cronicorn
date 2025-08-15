/**
 * Configuration interface for the scheduling engine
 *
 * Simplified config - no database config needed since we use API client
 */

/**
 * AI Agent configuration options
 */
export type AIAgentConfig = {
  /** The model to use for AI agent operations (default: 'gpt-4o') */
  model: string;

  /** Temperature for AI model (0.0-1.0, lower is more deterministic) */
  temperature?: number;

  /** Maximum number of retries for AI API calls */
  maxRetries?: number;

  /** Maximum tokens to use in prompts */
  maxPromptTokens?: number;

  /** Whether to use streaming responses (experimental) */
  streaming?: boolean;
};

/**
 * Execution configuration for endpoint calls
 */
export type ExecutionConfig = {
  /** Maximum concurrent endpoint executions */
  maxConcurrency: number;

  /** Default concurrency limit for mixed/parallel execution plans */
  defaultConcurrencyLimit?: number;

  /** Default timeout for endpoint calls in milliseconds */
  defaultTimeoutMs: number;

  /** Maximum retries for failed endpoint calls */
  maxEndpointRetries?: number;

  /** Whether to allow endpoint call cancellation */
  allowCancellation?: boolean;

  /** Maximum length of response content to store (in characters) */
  responseContentLengthLimit?: number;

  /** Whether to validate response schemas */
  validateResponseSchemas?: boolean;

  /** Timeout for the entire execution phase in milliseconds */
  executionPhaseTimeoutMs?: number;
};

/**
 * Metrics collection configuration
 */
export type MetricsConfig = {
  /** Whether metrics collection is enabled */
  enabled: boolean;

  /** Sampling rate for detailed metrics (0.0-1.0) */
  samplingRate?: number;

  /** Whether to track token usage for AI operations */
  trackTokenUsage?: boolean;
};

/**
 * Scheduler behavior configuration
 */
export type SchedulerConfig = {
  /** Maximum jobs to process in a single batch */
  maxBatchSize?: number;

  /** Job processing interval in milliseconds */
  processingIntervalMs?: number;

  /** Whether to auto-unlock stale jobs */
  autoUnlockStaleJobs?: boolean;

  /** Time in milliseconds after which a job lock is considered stale */
  staleLockThresholdMs?: number;

  /** Maximum number of jobs processed concurrently within a cycle */
  jobProcessingConcurrency?: number;
};

/**
 * Main engine configuration - simplified without database config
 */
export type EngineConfig = {
  /** AI agent configuration */
  aiAgent: AIAgentConfig;

  /** Execution configuration */
  execution: ExecutionConfig;

  /** Metrics configuration */
  metrics: MetricsConfig;

  /** Scheduler configuration */
  scheduler?: SchedulerConfig;

  /** Logger instance (optional) */
  logger?: any;
};
