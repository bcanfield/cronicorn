/**
 * Core types for the scheduling engine
 */

/**
 * Engine state
 */
export type EngineState = {
  /** Current status of the engine */
  status: "stopped" | "running" | "paused" | "error";

  /** When the engine was started */
  startTime?: Date;

  /** When the engine was stopped */
  stopTime?: Date;

  /** Last time the engine processed jobs */
  lastProcessingTime: Date | null;

  /** Engine statistics */
  stats: {
    /** Total number of jobs processed */
    totalJobsProcessed: number;

    /** Number of successfully processed jobs */
    successfulJobs: number;

    /** Number of failed jobs */
    failedJobs: number;

    /** Total number of endpoint calls made */
    totalEndpointCalls: number;

    /** Number of AI agent calls made */
    aiAgentCalls: number;
  };
};

/**
 * Result of a processing cycle
 */
export type ProcessingResult = {
  /** When the processing cycle started */
  startTime: Date;

  /** When the processing cycle ended */
  endTime: Date;

  /** Duration of the processing cycle in milliseconds */
  duration?: number;

  /** Number of jobs processed */
  jobsProcessed: number;

  /** Number of successful jobs */
  successfulJobs: number;

  /** Number of failed jobs */
  failedJobs: number;

  /** Errors encountered during processing */
  errors: Array<{
    /** Error message */
    message: string;

    /** Job ID if specific to a job */
    jobId?: string;

    /** Endpoint ID if specific to an endpoint */
    endpointId?: string;
  }>;
};

/**
 * Job context provided to the AI agent
 */
export type JobContext = {
  /** Job information */
  job: {
    /** Unique ID of the job */
    id: string;

    /** Natural language definition of the job */
    definitionNL: string;

    /** Current job status */
    status: "ACTIVE" | "PAUSED" | "ARCHIVED";

    /** Next scheduled run time */
    nextRunAt?: string;

    /** Whether the job is locked */
    locked: boolean;

    /** Default headers for all endpoint calls */
    defaultHeaders?: Record<string, string>;

    /** When the job was created */
    createdAt: string;

    /** When the job was last updated */
    updatedAt: string;
  };

  /** Available endpoints */
  endpoints: Array<{
    /** Unique ID of the endpoint */
    id: string;

    /** Name of the endpoint */
    name: string;

    /** Endpoint URL */
    url: string;

    /** HTTP method */
    method: string;

    /** JSON schema for request validation */
    requestSchema?: string;

    /** Maximum timeout in milliseconds */
    timeoutMs: number;

    /** Whether the endpoint is fire-and-forget */
    fireAndForget: boolean;

    /** Default headers for this endpoint */
    defaultHeaders?: Record<string, string>;

    /** Maximum request size in bytes */
    maxRequestSizeBytes?: number;

    /** Maximum response size in bytes */
    maxResponseSizeBytes?: number;

    /** When the endpoint was created */
    createdAt: string;
  }>;

  /** Message history */
  messages: Array<{
    /** Unique ID of the message */
    id: string;

    /** Role of the message sender */
    role: "system" | "user" | "assistant" | "tool";

    /** Message content */
    content: string | MessageContent[];

    /** When the message was created */
    timestamp: string;

    /** Origin of the message */
    source?: string;
  }>;

  /** Endpoint usage history */
  endpointUsage: Array<{
    /** Unique ID of the usage record */
    id: string;

    /** ID of the endpoint used */
    endpointId: string;

    /** When the endpoint was used */
    timestamp: string;

    /** Size of the request in bytes */
    requestSizeBytes?: number;

    /** Size of the response in bytes */
    responseSizeBytes?: number;

    /** Execution time in milliseconds */
    executionTimeMs: number;

    /** HTTP status code */
    statusCode?: number;

    /** Whether the call was successful */
    success: number;

    /** Whether the response was truncated */
    truncated?: number;

    /** Error message if failed */
    errorMessage?: string;
  }>;

  /** Optional execution context */
  executionContext?: {
    /** Current time of processing */
    currentTime: string;

    /** Environment */
    systemEnvironment: "production" | "development" | "test";

    /** Resource constraints */
    resourceConstraints?: {
      /** Maximum endpoint concurrency */
      maxEndpointConcurrency: number;

      /** Maximum execution time in milliseconds */
      maxExecutionTimeMs: number;
    };
  };
};

/**
 * Message content part
 */
export type MessageContent = {
  /** Type of content */
  type: string;

  /** Text content if type is 'text' */
  text?: string;

  /** Tool name if type is 'tool-call' */
  toolName?: string;

  /** Additional content data */
  [key: string]: any;
};

/**
 * Individual endpoint execution result
 */
export type EndpointExecutionResult = {
  /** ID of the endpoint */
  endpointId: string;

  /** Whether the call was successful */
  success: boolean;

  /** HTTP status code */
  statusCode: number;

  /** Response content (structured or stringified) */
  responseContent?: any;

  /** Error message if failed */
  error?: string;

  /** Execution time in milliseconds */
  executionTimeMs: number;

  /** When the execution completed */
  timestamp: string;

  /** Size of the request in bytes */
  requestSizeBytes?: number;

  /** Size of the response in bytes */
  responseSizeBytes?: number;

  /** Whether the response was truncated */
  truncated?: boolean;
};

/**
 * Execution results for endpoints
 */
export type ExecutionResults = {
  /** Individual endpoint results */
  results: Array<{
    /** ID of the endpoint */
    endpointId: string;

    /** Whether the call was successful */
    success: boolean;

    /** HTTP status code */
    statusCode?: number;

    /** Response content (structured or stringified) */
    responseContent?: any;

    /** Error message if failed */
    error?: string;

    /** Execution time in milliseconds */
    executionTimeMs: number;

    /** When the execution completed */
    timestamp: string;

    /** Size of the request in bytes */
    requestSizeBytes?: number;

    /** Size of the response in bytes */
    responseSizeBytes?: number;

    /** Whether the response was truncated */
    truncated?: boolean;
  }>;

  /** Execution summary */
  summary: {
    /** When execution started */
    startTime: string;

    /** When execution completed */
    endTime: string;

    /** Total duration in milliseconds */
    totalDurationMs: number;

    /** Number of successful endpoints */
    successCount: number;

    /** Number of failed endpoints */
    failureCount: number;
  };
};
