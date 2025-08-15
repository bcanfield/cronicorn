import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AIAgentConfig } from "../../config.js";
import type { ExecutionResults, JobContext } from "../../types.js";

import { cleanupAISDKMocks, enqueueGenerateObjectResults, setupAISDKMocks } from "../../tests/ai-agent-test-utils.js";
import { buildPlan, buildSchedule } from "../../tests/builders.js";

export type MetricsEvent = { type: string; phase: "plan" | "schedule"; category?: string };

vi.mock("@ai-sdk/openai", () => ({ openai: vi.fn().mockReturnValue({}) }));

function queuePlan(overrides: Partial<ReturnType<typeof buildPlan>>) {
  const plan = buildPlan(overrides);
  enqueueGenerateObjectResults({ object: plan, text: JSON.stringify(plan), usage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 }, finishReason: "stop" });
}

function queueSchedule(overrides: Partial<ReturnType<typeof buildSchedule>>) {
  const sched = buildSchedule(overrides);
  enqueueGenerateObjectResults({ object: sched, text: JSON.stringify(sched), usage: { inputTokens: 3, outputTokens: 4, totalTokens: 7 }, finishReason: "stop" });
}

type AIAgentCtor = typeof import("./agent.js").DefaultAIAgentService;
let AIAgentServiceClass: AIAgentCtor;

describe("ai agent - repair", () => {
  beforeEach(async () => {
    setupAISDKMocks();
    ({ DefaultAIAgentService: AIAgentServiceClass } = await import("./agent.js"));
  });
  afterEach(() => cleanupAISDKMocks());

  it("repairs malformed plan and emits metrics events", async () => {
    const events: MetricsEvent[] = [];
    const cfg: Partial<AIAgentConfig> = {
      model: "test-model",
      validateSemantics: true,
      semanticStrict: true,
      repairMalformedResponses: true,
      metricsHook: (e: MetricsEvent): void => {
        events.push(e);
      },
    };
    const aiAgent = new AIAgentServiceClass(cfg);
    // invalid then valid
    queuePlan({ concurrencyLimit: 1 });
    queuePlan({ concurrencyLimit: 2, reasoning: "fixed", confidence: 0.95 });
    const ctx: JobContext = { job: { id: "j-repair", definitionNL: "d", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [] };
    const plan = await aiAgent.planExecution(ctx);
    expect(plan.concurrencyLimit).toBe(2);
    expect(events.find(e => e.type === "repairAttempt" && e.phase === "plan")).toBeTruthy();
    expect(events.find(e => e.type === "repairSuccess" && e.phase === "plan")).toBeTruthy();
    expect(plan.usage?.totalTokens).toBe(5); // usage preserved from second (successful) call
  });

  it("repairs malformed schedule and emits metrics events", async () => {
    const events: MetricsEvent[] = [];
    const cfg: Partial<AIAgentConfig> = {
      model: "test-model",
      validateSemantics: true,
      semanticStrict: true,
      repairMalformedResponses: true,
      metricsHook: (e: MetricsEvent): void => {
        events.push(e);
      },
    };
    const aiAgent = new AIAgentServiceClass(cfg);
    const past = new Date(Date.now() - 60_000).toISOString();
    const future = new Date(Date.now() + 3_600_000).toISOString();
    // invalid then valid
    queueSchedule({ nextRunAt: past, reasoning: "past" });
    queueSchedule({ nextRunAt: future, reasoning: "future" });
    const ctx: JobContext = { job: { id: "j-sched", definitionNL: "d", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [] };
    const exec: ExecutionResults = { results: [], summary: { startTime: new Date().toISOString(), endTime: new Date().toISOString(), totalDurationMs: 0, successCount: 0, failureCount: 0 } };
    const schedule = await aiAgent.finalizeSchedule(ctx, exec);
    expect(schedule.nextRunAt).toBe(future);
    expect(events.find(e => e.type === "repairAttempt" && e.phase === "schedule")).toBeTruthy();
    expect(events.find(e => e.type === "repairSuccess" && e.phase === "schedule")).toBeTruthy();
    expect(schedule.usage?.totalTokens).toBe(7);
  });
});
