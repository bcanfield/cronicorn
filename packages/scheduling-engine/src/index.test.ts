import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSchedulingEngine, SchedulingEngine, validateEngineConfig } from "./index.js";

// Mock underlying services so no real API calls occur
vi.mock("./services/index.js", () => ({
  ApiDatabaseService: vi.fn().mockImplementation(() => ({
    getJobsToProcess: vi.fn().mockResolvedValue([]),
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

  it("exports factory and constructs engine; default scheduler values validated", async () => {
    const engine = createSchedulingEngine({
      aiAgent: { model: "gpt-4o" },
      execution: { maxConcurrency: 5, defaultTimeoutMs: 30000 },
      metrics: { enabled: true },
    });

    expect(engine).toBeInstanceOf(SchedulingEngine);

    // Validate that omitted scheduler config yields defaults (maxBatchSize=20)
    const validated = validateEngineConfig({ aiAgent: { model: "gpt-4o" }, execution: { maxConcurrency: 1, defaultTimeoutMs: 1000 }, metrics: { enabled: true } });
    const schedulerCfg = validated.scheduler;
    expect(schedulerCfg && schedulerCfg.maxBatchSize).toBe(20);
  });
});
