import { describe, expect, it } from "vitest";

import type { AIAgentPlanResponse } from "../services/ai-agent/types.js";
import type { EngineState, ExecutionResults, JobContext } from "../types.js";

import { validateEngineConfig } from "../config.js";
import { runPlanWithWrapper, runScheduleWithWrapper } from "./ai-wrappers.js";

const jobContext: JobContext = {
  job: {
    id: "job1",
    definitionNL: "Test Job definition",
    status: "ACTIVE",
    locked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  endpoints: [],
  messages: [],
  endpointUsage: [],
  executionContext: { currentTime: new Date().toISOString(), systemEnvironment: "test" },
};

function baseState(): EngineState {
  return {
    status: "running",
    lastProcessingTime: null,
    stats: {
      totalJobsProcessed: 0,
      successfulJobs: 0,
      failedJobs: 0,
      totalEndpointCalls: 0,
      aiAgentCalls: 0,
    },
  };
}

describe("ai-wrappers", () => {
  it("plan wrapper propagates success without modifying malformed counters", async () => {
    const config = validateEngineConfig({ aiAgent: {}, execution: {}, metrics: {}, scheduler: {}, logger: undefined });
    const state = baseState();
    const planResponse: AIAgentPlanResponse = {
      endpointsToCall: [],
      executionStrategy: "sequential",
      reasoning: "ok",
      confidence: 0.9,
    };
    const aiAgent = {
      planExecution: async () => planResponse,
      finalizeSchedule: async () => { throw new Error("not used"); },
    };
    const result = await runPlanWithWrapper({ aiAgent, config, state }, jobContext);
    expect(result).toBe(planResponse);
    expect(state.stats.malformedResponsesPlan).toBeUndefined();
  });

  it("plan wrapper records malformed + repair success", async () => {
    const config = validateEngineConfig({ aiAgent: { repairMalformedResponses: true }, execution: {}, metrics: {}, scheduler: {}, logger: undefined });
    const state = baseState();
    let attempt = 0;
    const aiAgent = {
      planExecution: async () => {
        attempt++;
        if (attempt === 1) {
          throw new Error("Semantic validation failed: test");
        }
        return { endpointsToCall: [], executionStrategy: "sequential", reasoning: "fixed", confidence: 0.5 } satisfies AIAgentPlanResponse;
      },
      finalizeSchedule: async () => { throw new Error("not used"); },
    };
    const result = await runPlanWithWrapper({ aiAgent, config, state }, jobContext);
    expect(result.reasoning).toBe("fixed");
    expect(state.stats.repairAttemptsPlan).toBe(1);
    expect(state.stats.repairSuccessesPlan).toBe(1);
    expect(state.stats.malformedResponsesPlan).toBeUndefined();
  });

  it("schedule wrapper classifies malformed when repair disabled", async () => {
    const config = validateEngineConfig({ aiAgent: { repairMalformedResponses: false }, execution: {}, metrics: {}, scheduler: {}, logger: undefined });
    const state = baseState();
    const aiAgent = {
      planExecution: async () => { throw new Error("not used"); },
      finalizeSchedule: async () => { throw new Error("Semantic validation failed: schedule"); },
    };
    const execResults: ExecutionResults = { results: [], summary: { startTime: new Date().toISOString(), endTime: new Date().toISOString(), totalDurationMs: 0, successCount: 0, failureCount: 0 } };
    await expect(runScheduleWithWrapper({ aiAgent, config, state }, jobContext, execResults)).rejects.toThrow();
    expect(state.stats.malformedResponsesSchedule).toBe(1);
  });

  it("schedule wrapper attempts repair then records failure", async () => {
    const config = validateEngineConfig({ aiAgent: { repairMalformedResponses: true }, execution: {}, metrics: {}, scheduler: {}, logger: undefined });
    const state = baseState();
    let attempts = 0;
    const aiAgent = {
      planExecution: async () => { throw new Error("not used"); },
      finalizeSchedule: async () => {
        attempts++;
        throw new Error(`Semantic validation failed: schedule attempt ${attempts}`);
      },
    };
    const execResults: ExecutionResults = { results: [], summary: { startTime: new Date().toISOString(), endTime: new Date().toISOString(), totalDurationMs: 0, successCount: 0, failureCount: 0 } };
    await expect(runScheduleWithWrapper({ aiAgent, config, state }, jobContext, execResults)).rejects.toThrow();
    expect(state.stats.repairAttemptsSchedule).toBe(1);
    expect(state.stats.repairFailuresSchedule).toBe(1);
    expect(state.stats.malformedResponsesSchedule).toBe(1);
  });
});
