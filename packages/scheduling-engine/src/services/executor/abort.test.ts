import { type RequestInfo as NFRequestInfo, type RequestInit as NFRequestInit, Response } from "node-fetch";
import { describe, expect, it } from "vitest";

import type { ExecutionConfig } from "../../config.js";
import type { JobContext } from "../../types.js";

import { DefaultEndpointExecutorService } from "./endpoint-executor.js";

function makeJobContext(): JobContext {
    const now = new Date().toISOString();
    return {
        job: { id: "job-abort", definitionNL: "Abort test", status: "ACTIVE", locked: false, createdAt: now, updatedAt: now },
        endpoints: [{ id: "ep-abort", name: "Abort EP", url: "https://example.com/slow", method: "GET", timeoutMs: 2000, fireAndForget: false, createdAt: now }],
        messages: [],
        endpointUsage: [],
        executionContext: { currentTime: now, systemEnvironment: "test" },
    };
}

function makeExecutor(cfg?: Partial<ExecutionConfig>) {
    const base: ExecutionConfig = {
        maxConcurrency: 5,
        defaultConcurrencyLimit: 3,
        defaultTimeoutMs: 5000,
        maxEndpointRetries: 0,
        allowCancellation: true,
        responseContentLengthLimit: 10000,
        validateResponseSchemas: true,
        circuitBreaker: { enabled: true, failureThreshold: 2, windowMs: 60000, cooldownMs: 50, halfOpenMaxCalls: 1, halfOpenSuccessesToClose: 1, halfOpenFailuresToReopen: 1 },
        executionPhaseTimeoutMs: undefined,
        logSamplingRate: 0,
        ...cfg,
    };
    return new DefaultEndpointExecutorService(base);
}

describe("abort propagation", () => {
    it("marks endpoint as aborted when external signal aborts before fetch resolves", async () => {
        const executor = makeExecutor();
        const controller = new AbortController();
        const jobContext = makeJobContext();
        jobContext.executionContext = {
            currentTime: jobContext.executionContext?.currentTime || new Date().toISOString(),
            systemEnvironment: jobContext.executionContext?.systemEnvironment || "test",
            abortSignal: controller.signal,
        };

        executor.fetch = async (url: NFRequestInfo | URL, init?: NFRequestInit): Promise<Response> => {
            void url; // reference to satisfy unused var rule
            return await new Promise<Response>((resolve, reject) => {
                const sig = init?.signal;
                if (sig?.aborted) {
                    reject(new Error("AbortError"));
                    return;
                }
                const onAbort = () => {
                    reject(new Error("AbortError"));
                };
                sig?.addEventListener("abort", onAbort);
                setTimeout(() => {
                    sig?.removeEventListener("abort", onAbort);
                    resolve(new Response("ok", { status: 200 }));
                }, 1000);
            });
        };

        const promise = executor._executeSingle(jobContext, { endpointId: "ep-abort", priority: 1, critical: false });
        setTimeout(() => controller.abort(), 50);
        const result = await promise;
        expect(result.aborted).toBe(true);
        expect(result.success).toBe(false);
    });
});
