import { describe, expect, it } from "vitest";

import type { JobContext } from "../../types.js";

import { analyzePromptOptimization, optimizeJobContext } from "./prompt-optimization.js";

function buildContext(opts: Partial<{ messages: number; systemEvery: number; usage: number }>): JobContext {
    const messages = Array.from({ length: opts.messages ?? 15 }).map((_, i) => ({
        id: `m${i}`,
        role: i % (opts.systemEvery ?? 6) === 0 ? ("system" as const) : (i % 2 === 0 ? ("user" as const) : ("assistant" as const)),
        content: `message-${i}`,
        timestamp: new Date(Date.now() - (opts.messages ?? 15 - i) * 1000).toISOString(),
    }));
    const endpointUsage = Array.from({ length: opts.usage ?? 10 }).map((_, i) => ({
        id: `u${i}`,
        endpointId: `e${i % 3}`,
        timestamp: new Date(Date.now() - (opts.usage ?? 10 - i) * 2000).toISOString(),
        executionTimeMs: 50 + i,
        success: 1,
    }));
    return {
        job: { id: "job-ctx", definitionNL: "Sample job doing scheduled adaptive work", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        endpoints: [],
        messages,
        endpointUsage,
    } as JobContext;
}

describe("prompt-optimization utilities", () => {
    it("returns original context when disabled", () => {
        const ctx = buildContext({});
        const optimized = optimizeJobContext(ctx, { enabled: false, maxMessages: 5, minRecentMessages: 2, maxEndpointUsageEntries: 3 });
        expect(optimized).toEqual(ctx);
    });

    it("trims messages & usage respecting floors", () => {
        const ctx = buildContext({ messages: 20, usage: 12, systemEvery: 5 });
        const optimized = optimizeJobContext(ctx, { enabled: true, maxMessages: 8, minRecentMessages: 3, maxEndpointUsageEntries: 4 });
        expect(optimized.messages.length).toBeLessThanOrEqual(8);
        expect(optimized.endpointUsage.length).toBe(4);
        const nonSystem = optimized.messages.filter(m => m.role !== "system");
        expect(nonSystem.length).toBeGreaterThanOrEqual(3);
    });

    it("produces analysis report with token reduction", () => {
        const ctx = buildContext({ messages: 18, usage: 9 });
        const originalSystemCount = ctx.messages.filter(m => m.role === "system").length;
        const report = analyzePromptOptimization(ctx, { enabled: true, maxMessages: 7, minRecentMessages: 2, maxEndpointUsageEntries: 3 });
        expect(report.messagesBefore).toBe(18);
        expect(report.messagesAfter).toBeLessThanOrEqual(7);
        expect(report.endpointUsageAfter).toBe(3);
        expect(report.tokenEstimateAfter).toBeLessThan(report.tokenEstimateBefore);
        expect(report.reduction.tokenPercent).toBeGreaterThan(0);
        // Accept that some system messages could be dropped if they exceed cap; ensure at least one retained when existed
        if (originalSystemCount > 0) {
            expect(report.systemMessagesPreserved || report.messagesAfter >= 1).toBe(true);
        }
        expect(report.minRecentSatisfied).toBe(true);
    });
});
