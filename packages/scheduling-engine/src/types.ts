/**
 * Core types for the scheduling engine
 *
 * Minimal type definitions - the heavy lifting is done by the API layer
 */

/**
 * Job context - minimal definition, API layer handles the complexity
 */
export type JobContext = {
  job: {
    id: string;
    definitionNL: string;
    status: "ACTIVE" | "PAUSED" | "ARCHIVED";
    nextRunAt?: string;
    locked: boolean;
    defaultHeaders?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
  };
  endpoints: Array<{
    id: string;
    name: string;
    url: string;
    method: string;
    requestSchema?: string;
    timeoutMs: number;
    fireAndForget: boolean;
    defaultHeaders?: Record<string, string>;
    maxRequestSizeBytes?: number;
    maxResponseSizeBytes?: number;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    timestamp: string;
    source?: string;
  }>;
  endpointUsage: Array<{
    id: string;
    endpointId: string;
    timestamp: string;
    requestSizeBytes?: number;
    responseSizeBytes?: number;
    executionTimeMs: number;
    statusCode?: number;
    success: number;
    truncated?: number;
    errorMessage?: string;
  }>;
  executionContext?: {
    currentTime: string;
    systemEnvironment: "production" | "development" | "test";
    resourceConstraints?: {
      maxEndpointConcurrency: number;
      maxExecutionTimeMs: number;
    };
  };
};

/**
 * Engine-specific state type
 */
export type EngineState = {
  status: "stopped" | "running" | "paused" | "error";
  startTime?: Date;
  stopTime?: Date;
  lastProcessingTime: Date | null;
  stats: {
    totalJobsProcessed: number;
    successfulJobs: number;
    failedJobs: number;
    totalEndpointCalls: number;
    aiAgentCalls: number;
    // performance metrics
    totalCyclesProcessed?: number;
    totalProcessingTimeMs?: number;
    lastCycleDurationMs?: number;
    avgCycleDurationMs?: number;
  };
};

/**
 * Engine-specific processing result type
 */
export type ProcessingResult = {
  startTime: Date;
  endTime: Date;
  duration?: number;
  jobsProcessed: number;
  successfulJobs: number;
  failedJobs: number;
  errors: Array<{
    message: string;
    jobId?: string;
    endpointId?: string;
  }>;
};

/**
 * Individual endpoint execution result
 */
export type EndpointExecutionResult = {
  endpointId: string;
  success: boolean;
  statusCode: number;
  responseContent?: any;
  error?: string;
  executionTimeMs: number;
  timestamp: string;
  requestSizeBytes?: number;
  responseSizeBytes?: number;
  truncated?: boolean;
};

/**
 * Execution results collection with summary
 */
export type ExecutionResults = {
  results: EndpointExecutionResult[];
  summary: {
    startTime: string;
    endTime: string;
    totalDurationMs: number;
    successCount: number;
    failureCount: number;
  };
};
