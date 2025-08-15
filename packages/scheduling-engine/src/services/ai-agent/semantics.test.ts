import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { JobContext } from "../../types.js";

import { cleanupAISDKMocks, enqueueGenerateObjectResults, setupAISDKMocks } from "../../tests/ai-agent-test-utils.js";
import { buildPlan, buildSchedule } from "../../tests/builders.js";

vi.mock("@ai-sdk/openai", () => ({ openai: vi.fn().mockReturnValue({}) }));

function enqueuePlanInvalid() {
    const invalid = buildPlan({ concurrencyLimit: 1 });
    enqueueGenerateObjectResults({ object: invalid, text: JSON.stringify(invalid), usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 }, finishReason: "stop" });
}

function enqueueScheduleInvalid(past: string) {
    const bad = buildSchedule({ nextRunAt: past });
    enqueueGenerateObjectResults({ object: bad, text: JSON.stringify(bad), usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 }, finishReason: "stop" });
}

type AIAgentCtor = typeof import("./agent.js").DefaultAIAgentService;
let AIAgentServiceClass: AIAgentCtor;

describe("ai agent - semantics", () => {
    beforeEach(async () => {
        setupAISDKMocks();
        ({ DefaultAIAgentService: AIAgentServiceClass } = await import("./agent.js"));
    });
    afterEach(() => cleanupAISDKMocks());

    it("fails planning with semantic issue when strict", async () => {
        enqueuePlanInvalid();
        const aiAgent = new AIAgentServiceClass({ model: "test-model", validateSemantics: true, semanticStrict: true });
        const ctx: JobContext = { job: { id: "j", definitionNL: "d", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [] };
        await expect(aiAgent.planExecution(ctx)).rejects.toThrow(/Semantic validation failed/);
    });

    it("fails schedule with semantic issue when strict", async () => {
        const past = new Date(Date.now() - 60_000).toISOString();
        enqueueScheduleInvalid(past);
        const aiAgent = new AIAgentServiceClass({ model: "test-model", validateSemantics: true, semanticStrict: true });
        const ctx: JobContext = { job: { id: "j2", definitionNL: "d2", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [] };
        await expect(aiAgent.finalizeSchedule(ctx, { results: [], summary: { startTime: new Date().toISOString(), endTime: new Date().toISOString(), totalDurationMs: 0, successCount: 0, failureCount: 0 } })).rejects.toThrow(/Semantic validation failed/);
    });
});
