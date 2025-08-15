import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ExecutionResults, JobContext } from "../../types.js";

import { cleanupAISDKMocks, enqueueGenerateObjectResults, setupAISDKMocks } from "../../tests/ai-agent-test-utils.js";
import { buildSchedule } from "../../tests/builders.js";

vi.mock("@ai-sdk/openai", () => ({ openai: vi.fn().mockReturnValue({}) }));

function queueSchedule(overrides: Partial<ReturnType<typeof buildSchedule>> = {}) {
    const sched = buildSchedule(overrides);
    enqueueGenerateObjectResults({
        object: sched,
        text: JSON.stringify(sched),
        usage: { inputTokens: 4, outputTokens: 6, totalTokens: 10 },
        finishReason: "stop",
    });
}

type AIAgentCtor = typeof import("./agent.js").DefaultAIAgentService;
let AIAgentServiceClass: AIAgentCtor;

describe("ai agent - finalizeSchedule", () => {
    beforeEach(async () => {
        setupAISDKMocks();
        ({ DefaultAIAgentService: AIAgentServiceClass } = await import("./agent.js"));
    });
    afterEach(() => cleanupAISDKMocks());

    it("generates a scheduling decision", async () => {
        queueSchedule();
        const aiAgent = new AIAgentServiceClass({ model: "test-model" });
        const ctx: JobContext = { job: { id: "job1", definitionNL: "def", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [], executionContext: { currentTime: new Date().toISOString(), systemEnvironment: "test" } };
        const exec: ExecutionResults = { results: [], summary: { startTime: new Date().toISOString(), endTime: new Date().toISOString(), totalDurationMs: 0, successCount: 0, failureCount: 0 } };
        const sched = await aiAgent.finalizeSchedule(ctx, exec);
        expect(new Date(sched.nextRunAt).getTime()).toBeGreaterThan(Date.now());
        expect(sched.usage?.totalTokens).toBe(10);
    });

    it("repairs semantic schedule when enabled", async () => {
        const aiAgent = new AIAgentServiceClass({ model: "test-model", validateSemantics: true, semanticStrict: true, repairMalformedResponses: true });
        const past = new Date(Date.now() - 60_000).toISOString();
        const future = new Date(Date.now() + 3_600_000).toISOString();
        queueSchedule({ nextRunAt: past });
        queueSchedule({ nextRunAt: future, reasoning: "future-fixed" });
        const ctx: JobContext = { job: { id: "job-sched", definitionNL: "d", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [] };
        const exec: ExecutionResults = { results: [], summary: { startTime: new Date().toISOString(), endTime: new Date().toISOString(), totalDurationMs: 0, successCount: 0, failureCount: 0 } };
        const sched = await aiAgent.finalizeSchedule(ctx, exec);
        expect(sched.nextRunAt).toBe(future);
        expect(sched.reasoning).toBe("future-fixed");
    });
});
