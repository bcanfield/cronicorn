import type { z } from "zod";

import { MockLanguageModelV2 } from "ai/test";
import { vi } from "vitest";

/**
 * Test utilities specifically for AI agent testing
 */

// We're using the mockId and mockValues helpers directly from 'ai/test' instead
// No need to reimplement these functions

/**
 * Creates a mock AI planning response for testing
 */
export function createMockPlanResponse() {
    return {
        endpointsToCall: [
            {
                endpointId: "endpoint-1",
                parameters: { query: "test" },
                headers: {},
                priority: 1,
                critical: true,
            },
        ],
        executionStrategy: "sequential",
        reasoning: "This is a test plan created by the mock AI agent.",
        confidence: 0.95,
    };
}

/**
 * Creates a mock AI scheduling response for testing
 */
export function createMockScheduleResponse() {
    return {
        nextRunAt: new Date(Date.now() + 3600000).toISOString(),
        reasoning: "Based on test results, scheduling for one hour from now.",
        confidence: 0.9,
        recommendedActions: [
            {
                type: "modify_frequency",
                details: "Consider increasing frequency based on data freshness needs.",
                priority: "medium",
            },
        ],
    };
}

/**
 * Creates mock AI agent for testing with the AI SDK approach
 */
export function createTestAIAgent() {
    // Planning phase mock
    const mockPlanModel = new MockLanguageModelV2({
        doGenerate: async () => ({
            finishReason: "stop",
            usage: { inputTokens: 25, outputTokens: 40, totalTokens: 65 },
            content: [{
                type: "text",
                text: JSON.stringify(createMockPlanResponse()),
            }],
            warnings: [],
        }),
    });

    // Scheduling phase mock
    const mockScheduleModel = new MockLanguageModelV2({
        doGenerate: async () => ({
            finishReason: "stop",
            usage: { inputTokens: 30, outputTokens: 35, totalTokens: 65 },
            content: [{
                type: "text",
                text: JSON.stringify(createMockScheduleResponse()),
            }],
            warnings: [],
        }),
    });

    return {
        planningModel: mockPlanModel,
        schedulingModel: mockScheduleModel,
    };
}

/**
 * Creates a mock generateObject response for planning
 * @param planSchema The Zod schema for plan validation
 */
export function mockGenerateObjectForPlanning(planSchema: z.ZodType<any>) {
    // This matches the structure returned by AI SDK's generateObject
    return {
        object: createMockPlanResponse() as z.infer<typeof planSchema>,
        text: JSON.stringify(createMockPlanResponse()),
        usage: { inputTokens: 25, outputTokens: 40, totalTokens: 65 },
        finishReason: "stop",
    };
}

/**
 * Creates a mock generateObject response for scheduling
 * @param scheduleSchema The Zod schema for schedule validation
 */
export function mockGenerateObjectForScheduling(scheduleSchema: z.ZodType<any>) {
    // This matches the structure returned by AI SDK's generateObject
    return {
        object: createMockScheduleResponse() as z.infer<typeof scheduleSchema>,
        text: JSON.stringify(createMockScheduleResponse()),
        usage: { inputTokens: 30, outputTokens: 35, totalTokens: 65 },
        finishReason: "stop",
    };
}

/**
 * Sets up mocks for the AI SDK modules
 *
 * This function follows the Vercel AI SDK testing patterns to provide
 * consistent mocks for the AI functions we use
 */
export function setupAISDKMocks() {
    vi.mock("ai", async () => {
        const actual = await vi.importActual("ai");

        return {
            ...actual as any,
            generateObject: vi.fn().mockImplementation(({ schema }) => {
                if (schema.shape?.endpointsToCall) {
                    return mockGenerateObjectForPlanning(schema);
                }
                else if (schema.shape?.nextRunAt) {
                    return mockGenerateObjectForScheduling(schema);
                }

                return {
                    object: {},
                    text: "{}",
                    usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
                    finishReason: "stop",
                };
            }),
            generateText: vi.fn().mockImplementation(() => ({
                text: "Mock generated text",
                usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
                finishReason: "stop",
            })),
        };
    });

    // Mock OpenAI provider
    vi.mock("@ai-sdk/openai", () => ({
        openai: vi.fn().mockReturnValue({}),
    }));

    // Add additional provider mocks as needed
}

/**
 * Cleans up AI SDK mocks
 */
export function cleanupAISDKMocks() {
    vi.resetModules();
    vi.clearAllMocks();
    vi.restoreAllMocks();
}

/**
 * Example usage:
 *
 * ```typescript
 * import { describe, it, beforeEach, afterEach, expect } from 'vitest';
 * import { generateObject } from 'ai';
 * import { setupAISDKMocks, cleanupAISDKMocks } from './ai-agent-test-utils';
 * import { DefaultAIAgentService } from '../services/ai-agent/agent';
 * import { planSchema } from '../services/ai-agent/schemas';
 *
 * describe('DefaultAIAgentService', () => {
 *   beforeEach(() => {
 *     setupAISDKMocks();
 *   });
 *
 *   afterEach(() => {
 *     cleanupAISDKMocks();
 *   });
 *
 *   it('should generate a plan for job execution', async () => {
 *     const aiAgent = new DefaultAIAgentService({
 *       modelId: 'test-model',
 *     });
 *
 *     const plan = await aiAgent.planJobExecution({
 *       jobId: 'test-job',
 *       definitionNL: 'Check weather and send notification',
 *       previousResults: [],
 *       endpoints: [
 *         { id: 'weather-api', description: 'Get weather data' },
 *         { id: 'notification-api', description: 'Send notification' }
 *       ],
 *     });
 *
 *     expect(plan).toHaveProperty('endpointsToCall');
 *     expect(plan.executionStrategy).toBe('sequential');
 *   });
 * });
 * ```
 */
