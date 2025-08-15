/**
 * Central test builders and mock helpers for the scheduling engine.
 * All test suites should import from this module instead of defining ad-hoc builders.
 */
import type { AIAgentPlanResponse, AIAgentScheduleResponse, TokenUsage } from "../services/ai-agent/types.js";

/** Build a minimal valid AI agent execution plan */
export function buildPlan(overrides: Partial<AIAgentPlanResponse> = {}): AIAgentPlanResponse {
  return {
    endpointsToCall: [],
    executionStrategy: "parallel",
    reasoning: "test reasoning",
    confidence: 0.9,
    ...overrides,
  };
}

/** Build a minimal valid AI agent schedule response */
export function buildSchedule(overrides: Partial<AIAgentScheduleResponse> = {}): AIAgentScheduleResponse {
  return {
    nextRunAt: new Date(Date.now() + 60_000).toISOString(),
    reasoning: "future",
    confidence: 0.85,
    ...overrides,
  };
}

/** Shape of a mocked generateObject return (subset used in tests) */
export type MockGenerateObjectResult<T> = {
  object: T;
  usage: TokenUsage;
  text: string;
  finishReason: string;
  warnings: unknown[];
  toJsonResponse: () => Response;
};

/**
 * Provide a mock object shaped like generateObject's result for deterministic tests.
 */
export function mockGenerateObjectReturn<T>(obj: T): MockGenerateObjectResult<T> {
  const usage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  return {
    object: obj,
    usage,
    text: JSON.stringify(obj),
    finishReason: "stop",
    warnings: [],
    toJsonResponse: () => new Response(JSON.stringify(obj), { headers: { "content-type": "application/json" } }),
  };
}
