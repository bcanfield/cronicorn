import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSchedulingEngine, SchedulingEngine } from "./index.js";

// Mock underlying services so no real API calls occur
vi.mock("./services/index.js", () => ({
  ApiDatabaseService: vi.fn().mockImplementation(() => ({
    getJobsToProcess: vi.fn(),
    lockJob: vi.fn(),
    unlockJob: vi.fn(),
    getJobContext: vi.fn(),
    recordExecutionPlan: vi.fn(),
    recordEndpointResults: vi.fn(),
    recordExecutionSummary: vi.fn(),
    updateJobSchedule: vi.fn(),
    recordJobError: vi.fn(),
  })),
  DefaultAIAgentService: vi.fn().mockImplementation(() => ({
    planExecution: vi.fn(),
    finalizeSchedule: vi.fn(),
  })),
  DefaultEndpointExecutorService: vi.fn().mockImplementation(() => ({
    executeEndpoints: vi.fn(),
  })),
}));

describe("package public surface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports factory and constructs engine with default scheduler values", async () => {
    const engine = createSchedulingEngine({
      aiAgent: { model: "gpt-4o" },
      execution: { maxConcurrency: 5, defaultTimeoutMs: 30000 },
      metrics: { enabled: true },
      // Intentionally omit scheduler config to rely on defaults
    } as any);

    expect(engine).toBeInstanceOf(SchedulingEngine);

    // Access mocked database service
    const db = (engine as any).database;
    db.getJobsToProcess.mockResolvedValue([]);

    // Calling a cycle should use default maxBatchSize = 20
    await engine.processCycle();
    expect(db.getJobsToProcess).toHaveBeenCalledWith(20);
  });
});
