import { Response } from "node-fetch";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventsConfig, ExecutionConfig } from "../../config.js";
import type { JobContext } from "../../types.js";

import { DefaultEndpointExecutorService } from "./endpoint-executor.js";

// Helper to build a minimal job context without type assertions
function makeJobContext(): JobContext {
    const now = new Date().toISOString();
    return {
        job: {
            id: "job-1",
            definitionNL: "Test job",
            status: "ACTIVE",
            locked: false,
            createdAt: now,
            updatedAt: now,
        },
        endpoints: [
            {
                id: "ep-1",
                name: "Endpoint 1",
                url: "https://example.com/ep1",
                method: "GET",
                timeoutMs: 50,
                fireAndForget: false,
                createdAt: now,
            },
        ],
        messages: [],
        endpointUsage: [],
    };
}

// Build executor with merged defaults (no assertions / any)
function makeExecutor(overrides: Partial<ExecutionConfig> = {}, events?: EventsConfig): DefaultEndpointExecutorService {
    const defaultCircuitBreaker: ExecutionConfig["circuitBreaker"] = {
        enabled: true,
        failureThreshold: 2,
        windowMs: 60000,
        cooldownMs: 50,
        halfOpenMaxCalls: 1,
        halfOpenSuccessesToClose: 1,
        halfOpenFailuresToReopen: 1,
    };
    const circuitBreaker: ExecutionConfig["circuitBreaker"] = {
        ...defaultCircuitBreaker,
        ...(overrides.circuitBreaker || {}),
    };
    const base: ExecutionConfig = {
        maxConcurrency: 5,
        defaultConcurrencyLimit: 3,
        defaultTimeoutMs: 30000,
        maxEndpointRetries: 3,
        allowCancellation: false,
        responseContentLengthLimit: 10000,
        validateResponseSchemas: true,
        circuitBreaker,
        executionPhaseTimeoutMs: overrides.executionPhaseTimeoutMs,
    };
    const merged: ExecutionConfig = { ...base, ...overrides, circuitBreaker };
    return new DefaultEndpointExecutorService(merged, events);
}

describe("endpoint executor", () => {
    let jobContext: JobContext;
    beforeEach(() => {
        jobContext = makeJobContext();
    });

    it("retries failing endpoint until success within max retries", async () => {
        const executor = makeExecutor({ maxEndpointRetries: 4 });
        let callCount = 0;
        executor.fetch = async () => {
            callCount++;
            if (callCount < 3) {
                return new Response("server error", { status: 500 });
            }
            return new Response(JSON.stringify({ ok: true }), { status: 200 });
        };
        const result = await executor._executeSingle(jobContext, {
            endpointId: "ep-1",
            priority: 1,
            critical: false,
        });
        expect(result.success).toBe(true);
        expect(result.attempts).toBe(3);
    });

    it("exhausts retries and reports failure", async () => {
        const executor = makeExecutor({ maxEndpointRetries: 2 });
        executor.fetch = async () => new Response("svc unavailable", { status: 503 });
        const result = await executor._executeSingle(jobContext, { endpointId: "ep-1", priority: 1, critical: false });
        expect(result.success).toBe(false);
        expect(result.attempts).toBe(3);
        expect(result.error).toContain("HTTP 503");
    });

    it("opens circuit after threshold failures and short-circuits subsequent call", async () => {
        const stateChanges: Array<{ to: string; from?: string }> = [];
        const fullCircuitOverride: ExecutionConfig["circuitBreaker"] = {
            enabled: true,
            failureThreshold: 2,
            windowMs: 60000,
            cooldownMs: 50,
            halfOpenMaxCalls: 1,
            halfOpenSuccessesToClose: 1,
            halfOpenFailuresToReopen: 1,
        };
        const executor = makeExecutor({ maxEndpointRetries: 0, circuitBreaker: fullCircuitOverride }, {
            onCircuitStateChange: (e) => { stateChanges.push({ to: e.to, from: e.from }); },
        });
        executor.fetch = async () => new Response("err", { status: 500 });
        await executor._executeSingle(jobContext, { endpointId: "ep-1", priority: 1, critical: false });
        await executor._executeSingle(jobContext, { endpointId: "ep-1", priority: 1, critical: false });
        const snap = executor.circuitBreaker.getState("ep-1");
        expect(snap.state).toBe("open");
        const spy = vi.fn();
        executor.fetch = async () => {
            spy();
            return new Response("{}", { status: 200 });
        };
        const result = await executor._executeSingle(jobContext, { endpointId: "ep-1", priority: 1, critical: false });
        expect(result.success).toBe(false);
        expect(result.error).toBe("circuit_open");
        expect(spy).not.toHaveBeenCalled();
        expect(stateChanges.some(s => s.to === "open")).toBe(true);
    });

    it("transitions from open -> half_open -> closed after cooldown and success", async () => {
        const circuitOverride: ExecutionConfig["circuitBreaker"] = {
            enabled: true,
            failureThreshold: 1,
            windowMs: 60000,
            cooldownMs: 5,
            halfOpenMaxCalls: 1,
            halfOpenSuccessesToClose: 1,
            halfOpenFailuresToReopen: 1,
        };
        const executor = makeExecutor({ maxEndpointRetries: 0, circuitBreaker: circuitOverride });
        let failing = true;
        executor.fetch = async () => new Response(failing ? "fail" : JSON.stringify({ ok: true }), { status: failing ? 500 : 200 });
        await executor._executeSingle(jobContext, { endpointId: "ep-1", priority: 1, critical: false });
        const snap = executor.circuitBreaker.getState("ep-1");
        expect(snap.state).toBe("open");
        snap.openedAt = Date.now() - 10;
        failing = false;
        const result = await executor._executeSingle(jobContext, { endpointId: "ep-1", priority: 1, critical: false });
        expect(result.success).toBe(true);
        expect(executor.circuitBreaker.getState("ep-1").state).toBe("closed");
    });
});
