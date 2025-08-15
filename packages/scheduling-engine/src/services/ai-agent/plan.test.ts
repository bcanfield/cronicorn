import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { JobContext } from "../../types.js";

import { cleanupAISDKMocks, enqueueGenerateObjectResults, setupAISDKMocks } from "../../tests/ai-agent-test-utils.js";
import { buildPlan } from "../../tests/builders.js";

vi.mock("@ai-sdk/openai", () => ({ openai: vi.fn().mockReturnValue({}) }));

function queuePlan(planOverrides: Partial<ReturnType<typeof buildPlan>> = {}) {
  const plan = buildPlan(planOverrides);
  enqueueGenerateObjectResults({
    object: plan,
    text: JSON.stringify(plan),
    usage: { inputTokens: 5, outputTokens: 7, totalTokens: 12 },
    finishReason: "stop",
  });
}

type AIAgentCtor = typeof import("./agent.js").DefaultAIAgentService;
let AIAgentServiceClass: AIAgentCtor;

describe("ai agent - planExecution", () => {
  beforeEach(async () => {
    setupAISDKMocks();
    ({ DefaultAIAgentService: AIAgentServiceClass } = await import("./agent.js"));
  });
  afterEach(() => cleanupAISDKMocks());

  it("generates a valid execution plan", async () => {
    queuePlan();
    const aiAgent = new AIAgentServiceClass({ model: "test-model" });
    const ctx: JobContext = { job: { id: "job1", definitionNL: "def", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [], executionContext: { currentTime: new Date().toISOString(), systemEnvironment: "test" } };
    const plan = await aiAgent.planExecution(ctx);
    expect(plan.endpointsToCall).toBeDefined();
    expect(plan.confidence).toBeGreaterThan(0);
    expect(plan.usage?.totalTokens).toBe(12);
  });

  it("adds semantic warnings when non-strict", async () => {
    queuePlan({ concurrencyLimit: 1 });
    const aiAgent = new AIAgentServiceClass({ model: "test-model", validateSemantics: true, semanticStrict: false });
    const ctx: JobContext = { job: { id: "j", definitionNL: "d", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [] };
    const plan = await aiAgent.planExecution(ctx);
    expect(plan.reasoning).toMatch(/SemanticWarnings/);
  });
});
