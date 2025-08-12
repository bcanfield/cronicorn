import { vi } from "vitest";

/**
 * Test utilities for scheduling engine tests
 */

/**
 * Creates a mock database service for testing
 */
export function createMockDatabaseService() {
  return {
    getJobsToProcess: vi.fn().mockResolvedValue(["job-1", "job-2"]),
    lockJob: vi.fn().mockResolvedValue(true),
    unlockJob: vi.fn().mockResolvedValue(true),
    getJobContext: vi.fn().mockResolvedValue({
      job: {
        id: "job-1",
        definitionNL: "Test job definition",
        defaultHeaders: {},
      },
      endpoints: [
        {
          id: "endpoint-1",
          name: "Test Endpoint",
          url: "https://example.com/api",
          method: "GET",
          timeoutMs: 5000,
        },
      ],
      messages: [],
      endpointUsage: [],
      executionContext: {
        currentTime: new Date().toISOString(),
      },
    }),
    recordExecutionPlan: vi.fn().mockResolvedValue(true),
    recordEndpointResults: vi.fn().mockResolvedValue(true),
    recordExecutionSummary: vi.fn().mockResolvedValue(true),
    updateJobSchedule: vi.fn().mockResolvedValue(true),
    recordJobError: vi.fn().mockResolvedValue(true),
  };
}

/**
 * Creates a mock AI agent service for testing
 */
export function createMockAIAgentService() {
  return {
    planExecution: vi.fn().mockResolvedValue({
      endpointsToCall: [
        {
          endpointId: "endpoint-1",
          parameters: { query: "test" },
          headers: {},
          priority: 1,
          critical: true,
        },
      ],
      executionStrategy: "sequential",
      reasoning: "Test reasoning",
      confidence: 0.95,
    }),
    finalizeSchedule: vi.fn().mockResolvedValue({
      nextRunAt: new Date(Date.now() + 3600000).toISOString(),
      reasoning: "Test scheduling reasoning",
      confidence: 0.9,
    }),
  };
}

/**
 * Creates a mock endpoint executor service for testing
 */
export function createMockEndpointExecutorService() {
  return {
    executeEndpoints: vi.fn().mockResolvedValue([
      {
        endpointId: "endpoint-1",
        success: true,
        statusCode: 200,
        executionTimeMs: 150,
        timestamp: new Date().toISOString(),
        responseContent: { result: "success" },
      },
    ]),
  };
}

/**
 * Creates a complete set of mock services for testing the engine
 */
export function createMockServices() {
  return {
    database: createMockDatabaseService(),
    aiAgent: createMockAIAgentService(),
    endpointExecutor: createMockEndpointExecutorService(),
  };
}

/**
 * Creates a mock configuration for testing
 */
export function createMockConfig() {
  return {
    pollIntervalMs: 1000,
    maxJobsPerCycle: 5,
    database: {
      connectionString: "mock-connection-string",
      maxConnections: 5,
    },
    aiAgent: {
      model: "test-model",
      temperature: 0.2,
      maxRetries: 2,
    },
    execution: {
      defaultTimeoutMs: 5000,
      defaultConcurrencyLimit: 3,
      responseContentLengthLimit: 10000,
    },
  };
}

/**
 * Test HTTP response factory
 */
export function createMockResponse(options: {
  ok?: boolean;
  status?: number;
  body?: any;
  headers?: Record<string, string>;
}) {
  const { ok = true, status = 200, body = {}, headers = {} } = options;

  let responseText = "";
  if (typeof body === "string") {
    responseText = body;
  }
  else {
    responseText = JSON.stringify(body);
  }

  return {
    ok,
    status,
    headers: new Map(Object.entries(headers)),
    text: vi.fn().mockResolvedValue(responseText),
    json: vi.fn().mockResolvedValue(body),
  };
}

/**
 * Sets up global mocks for HTTP requests
 */
export function setupGlobalMocks() {
  // Mock fetch
  globalThis.fetch = vi.fn();

  // Mock timers
  vi.useFakeTimers();
}

/**
 * Tears down global mocks
 */
export function teardownGlobalMocks() {
  vi.clearAllMocks();
  vi.useRealTimers();
}
