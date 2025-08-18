import { describe, expect, it, vi } from "vitest";

import type { EngineConfig } from "../config.js";
import type { AIAgentService } from "../services/ai-agent/types.js";
import type { DatabaseService } from "../services/database/database-service.js";
import type { EndpointExecutorService } from "../services/executor/endpoint-executor.js";
import type { EngineState } from "../types.js";
import type { CycleDeps } from "./process-cycle.js";

import { validateEngineConfig } from "../config.js";
import { processCycle } from "./process-cycle.js";

function makeConfig(overrides: Partial<EngineConfig> = {}): EngineConfig {
  return validateEngineConfig({ aiAgent: {}, execution: {}, metrics: {}, scheduler: {}, logger: undefined, ...overrides });
}
function makeState(): EngineState {
  return { status: "stopped", lastProcessingTime: null, stats: { totalJobsProcessed: 0, successfulJobs: 0, failedJobs: 0, totalEndpointCalls: 0, aiAgentCalls: 0, totalCyclesProcessed: 0, totalProcessingTimeMs: 0, lastCycleDurationMs: 0, avgCycleDurationMs: 0 } };
}

describe("processCycle helper", () => {
  it("handles empty job list", async () => {
    const config = makeConfig();
    const state = makeState();
    const db: DatabaseService = { getJobsToProcess: vi.fn().mockResolvedValue([]), lockJob: vi.fn(), unlockJob: vi.fn(), getJobContext: vi.fn(), recordExecutionPlan: vi.fn(), recordEndpointResults: vi.fn(), recordExecutionSummary: vi.fn(), updateJobSchedule: vi.fn(), recordJobError: vi.fn(), updateExecutionStatus: vi.fn(), updateJobTokenUsage: vi.fn(), getEngineMetrics: vi.fn() };
    const ai: AIAgentService = { planExecution: vi.fn(), finalizeSchedule: vi.fn() };
    const executor: EndpointExecutorService = { executeEndpoints: vi.fn() };
    const deps: CycleDeps = { engine: {}, config, state, database: db, executor, aiAgent: ai, log: {}, jobEscalationLevels: new Map(), disabledEndpointMap: new Map() };
    const res = await processCycle(deps);
    expect(res.jobsProcessed).toBe(0);
    expect(db.getJobsToProcess).toHaveBeenCalled();
  });
});
