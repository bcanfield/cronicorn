/**
 * SchedulingEngine core tests (type-safe, no `as` / `any`)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EngineConfig } from "./config.js";
import type { AIAgentPlanResponse, AIAgentScheduleResponse, AIAgentService } from "./services/ai-agent/types.js";
import type { DatabaseService } from "./services/database/database-service.js";
import type { EndpointExecutorService } from "./services/executor/endpoint-executor.js";
import type { EndpointExecutionResult, JobContext } from "./types.js";

import { SchedulingEngine } from "./engine.js";

// ----- Helpers -----
function buildConfig(partial: Partial<EngineConfig> = {}): EngineConfig {
  const base: EngineConfig = {
    aiAgent: {
      model: "gpt-4o",
      temperature: 0.2,
      maxRetries: 2,
      promptOptimization: { enabled: true, maxMessages: 10, minRecentMessages: 3, maxEndpointUsageEntries: 5 },
      validateSemantics: true,
      semanticStrict: true,
      repairMalformedResponses: true,
      maxRepairAttempts: 1,
    },
    execution: {
      maxConcurrency: 5,
      defaultConcurrencyLimit: 3,
      defaultTimeoutMs: 30000,
      maxEndpointRetries: 3,
      allowCancellation: false,
      responseContentLengthLimit: 10000,
      validateResponseSchemas: true,
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        windowMs: 60000,
        cooldownMs: 30000,
        halfOpenMaxCalls: 1,
        halfOpenSuccessesToClose: 1,
        halfOpenFailuresToReopen: 1,
      },
    },
    metrics: { enabled: true, samplingRate: 1, trackTokenUsage: true },
    scheduler: {
      maxBatchSize: 20,
      processingIntervalMs: 60000,
      autoUnlockStaleJobs: true,
      staleLockThresholdMs: 300000,
      jobProcessingConcurrency: 1,
    },
    logger: undefined,
  };
  return {
    ...base,
    ...partial,
    aiAgent: { ...base.aiAgent, ...partial.aiAgent },
    execution: { ...base.execution, ...partial.execution },
    metrics: { ...base.metrics, ...partial.metrics },
    scheduler: partial.scheduler ? { ...base.scheduler!, ...partial.scheduler } : base.scheduler,
  };
}

// Mocks retain references to underlying vi.fn for assertions without using `as`
function createDatabaseMock() {
  const getJobsToProcess = vi.fn<(limit: number) => Promise<string[]>>().mockResolvedValue([]);
  const lockJob = vi.fn<(id: string, until: Date) => Promise<boolean>>().mockResolvedValue(true);
  const unlockJob = vi.fn<(id: string) => Promise<boolean>>().mockResolvedValue(true);
  const getJobContext = vi.fn<(id: string) => Promise<JobContext | null>>().mockResolvedValue(null);
  const recordExecutionPlan = vi.fn<(id: string, plan: AIAgentPlanResponse) => Promise<boolean>>().mockResolvedValue(true);
  const recordEndpointResults = vi.fn<(id: string, r: EndpointExecutionResult[]) => Promise<boolean>>().mockResolvedValue(true);
  const recordExecutionSummary = vi.fn<(id: string, s: { startTime: string; endTime: string; totalDurationMs: number; successCount: number; failureCount: number }) => Promise<boolean>>().mockResolvedValue(true);
  const updateJobSchedule = vi.fn<(id: string, sched: AIAgentScheduleResponse) => Promise<boolean>>().mockResolvedValue(true);
  const recordJobError = vi.fn<(id: string, message: string) => Promise<boolean>>().mockResolvedValue(true);
  const updateExecutionStatus = vi.fn<(id: string, status: "RUNNING" | "FAILED", errorMessage?: string) => Promise<boolean>>().mockResolvedValue(true);
  const updateJobTokenUsage = vi.fn<(p: { jobId: string; inputTokensDelta?: number; outputTokensDelta?: number; reasoningTokensDelta?: number; cachedInputTokensDelta?: number }) => Promise<boolean>>().mockResolvedValue(true);
  const getEngineMetrics = vi.fn<() => Promise<{ activeJobs: number; jobsProcessedLastHour: number; avgProcessingTimeMs: number; errorRate: number }>>().mockResolvedValue({ activeJobs: 0, jobsProcessedLastHour: 0, avgProcessingTimeMs: 0, errorRate: 0 });
  const service: DatabaseService = {
    getJobsToProcess,
    lockJob,
    unlockJob,
    getJobContext,
    recordExecutionPlan,
    recordEndpointResults,
    recordExecutionSummary,
    updateJobSchedule,
    recordJobError,
    updateExecutionStatus,
    updateJobTokenUsage,
    getEngineMetrics,
  };
  return { service, mocks: { getJobsToProcess, lockJob, unlockJob, getJobContext } };
}

function createAIMock() {
  const planExecution = vi.fn<(ctx: JobContext) => Promise<AIAgentPlanResponse>>().mockResolvedValue({ endpointsToCall: [], executionStrategy: "sequential", reasoning: "r", confidence: 0.9 });
  const finalizeSchedule = vi.fn<(ctx: JobContext, _res: unknown) => Promise<AIAgentScheduleResponse>>().mockResolvedValue({ nextRunAt: new Date().toISOString(), reasoning: "r", confidence: 0.8 });
  const service: AIAgentService = { planExecution, finalizeSchedule };
  return { service, planExecution, finalizeSchedule };
}

function createExecutorMock() {
  const executeEndpoints = vi.fn<(ctx: JobContext, plan: AIAgentPlanResponse) => Promise<EndpointExecutionResult[]>>().mockResolvedValue([]);
  const service: EndpointExecutorService = { executeEndpoints };
  return { service, executeEndpoints };
}

const testTimestamp = "2024-01-01T00:00:00.000Z";

function makeContext(id: string): JobContext {
  return {
    job: { id, definitionNL: "Definition", status: "ACTIVE", nextRunAt: testTimestamp, locked: false, createdAt: testTimestamp, updatedAt: testTimestamp },
    endpoints: [{ id: "e1", name: "Endpoint", url: "https://example.com", method: "GET", timeoutMs: 30000, fireAndForget: false, createdAt: testTimestamp }],
    messages: [],
    endpointUsage: [],
    executionContext: { currentTime: testTimestamp, systemEnvironment: "test" },
  };
}

// ----- Test Suite -----
describe("scheduling engine", () => {
  let config: EngineConfig;
  let dbMock: ReturnType<typeof createDatabaseMock>;
  let aiMock: ReturnType<typeof createAIMock>;
  let execMock: ReturnType<typeof createExecutorMock>;
  let engine: SchedulingEngine;

  beforeEach(() => {
    config = buildConfig();
    dbMock = createDatabaseMock();
    aiMock = createAIMock();
    execMock = createExecutorMock();
    engine = new SchedulingEngine(config, { database: dbMock.service, aiAgent: aiMock.service, executor: execMock.service });
  });

  afterEach(async () => {
    if (engine.getState().status === "running")
      await engine.stop();
  });

  it("initial state", () => {
    const state = engine.getState();
    expect(state.status).toBe("stopped");
    expect(state.stats.totalJobsProcessed).toBe(0);
  });

  it("start/stop lifecycle", async () => {
    await engine.start();
    expect(engine.getState().status).toBe("running");
    await engine.stop();
    expect(engine.getState().status).toBe("stopped");
  });

  it("processes multiple jobs successfully", async () => {
    dbMock.mocks.getJobsToProcess.mockResolvedValue(["j1", "j2"]);
    dbMock.mocks.getJobContext.mockImplementation(async id => makeContext(id));
    aiMock.planExecution.mockResolvedValue({ endpointsToCall: [{ endpointId: "e1", priority: 1, critical: true }], executionStrategy: "sequential", reasoning: "r", confidence: 0.9 });
    execMock.executeEndpoints.mockResolvedValue([{ endpointId: "e1", success: true, statusCode: 200, executionTimeMs: 5, timestamp: testTimestamp }]);
    aiMock.finalizeSchedule.mockResolvedValue({ nextRunAt: new Date(Date.now() + 3600000).toISOString(), reasoning: "n", confidence: 0.8 });
    const result = await engine.processCycle();
    expect(result.jobsProcessed).toBe(2);
    expect(result.successfulJobs).toBe(2);
    const s = engine.getState().stats;
    expect(s.totalJobsProcessed).toBe(2);
    expect(s.aiAgentCalls).toBe(4);
  });

  it("handles empty job list", async () => {
    dbMock.mocks.getJobsToProcess.mockResolvedValue([]);
    const result = await engine.processCycle();
    expect(result.jobsProcessed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("handles plan error", async () => {
    dbMock.mocks.getJobsToProcess.mockResolvedValue(["j1"]);
    dbMock.mocks.getJobContext.mockImplementation(async id => makeContext(id));
    aiMock.planExecution.mockRejectedValue(new Error("boom"));
    const result = await engine.processCycle();
    expect(result.failedJobs).toBe(1);
    expect(result.errors[0].message).toBe("boom");
  });

  it("accumulates token usage", async () => {
    dbMock.mocks.getJobsToProcess.mockResolvedValue(["t1"]);
    dbMock.mocks.getJobContext.mockImplementation(async id => makeContext(id));
    aiMock.planExecution.mockResolvedValue({ endpointsToCall: [], executionStrategy: "sequential", reasoning: "r", confidence: 0.9, usage: { inputTokens: 3, outputTokens: 2, totalTokens: 5 } });
    aiMock.finalizeSchedule.mockResolvedValue({ nextRunAt: testTimestamp, reasoning: "r", confidence: 0.8, usage: { inputTokens: 4, outputTokens: 6, totalTokens: 10 } });
    await engine.processCycle();
    const stats = engine.getState().stats;
    expect(stats.aiInputTokens).toBe(7);
    expect(stats.aiOutputTokens).toBe(8);
    expect(stats.aiTotalTokens).toBe(15);
  });

  it("respects jobProcessingConcurrency", async () => {
    const conc = buildConfig({ scheduler: { ...buildConfig().scheduler!, jobProcessingConcurrency: 3 } });
    const cdb = createDatabaseMock();
    const cai = createAIMock();
    const cexec = createExecutorMock();
    cdb.mocks.getJobsToProcess.mockResolvedValue(["a", "b", "c", "d", "e"]);
    cdb.mocks.getJobContext.mockImplementation(async id => makeContext(id));
    const cengine = new SchedulingEngine(conc, { database: cdb.service, aiAgent: cai.service, executor: cexec.service });
    const res = await cengine.processCycle();
    expect(res.jobsProcessed).toBe(5);
    expect(cai.planExecution.mock.calls.length).toBe(5);
  });

  it("updates malformed/repair metrics counters", async () => {
    // Arrange one job that triggers malformed then repair success in plan, and malformed + repair failure in schedule
    dbMock.mocks.getJobsToProcess.mockResolvedValue(["m1"]);
    dbMock.mocks.getJobContext.mockImplementation(async id => makeContext(id));
    // Plan: first call throws semantic error triggering repair (success), second returns valid
    let planCall = 0;
    aiMock.planExecution.mockImplementation(async () => {
      planCall++;
      if (planCall === 1)
        throw new Error("Semantic validation failed: issue");
      return { endpointsToCall: [], executionStrategy: "sequential", reasoning: "repaired", confidence: 0.9 };
    });
    // Schedule: first throws schema parse (repair attempt) then throws again (failure)
    let schedCall = 0;
    aiMock.finalizeSchedule.mockImplementation(async () => {
      schedCall++;
      if (schedCall === 1)
        throw new Error("Error parsing schedule schema");
      throw new Error("Error parsing schedule schema");
    });
    // Act
    await engine.processCycle();
    const s = engine.getState().stats;
    // Assert plan metrics
    expect(s.repairAttemptsPlan).toBe(1);
    expect(s.repairSuccessesPlan).toBe(1);
    // Schedule failed twice: one malformed + attempt + failure
    expect(s.repairAttemptsSchedule).toBe(1);
    expect(s.repairFailuresSchedule).toBe(1);
    expect(s.malformedResponsesSchedule).toBe(1); // final thrown error classified malformed
  });
});
