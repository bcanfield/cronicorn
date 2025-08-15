import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ExecutionResults, JobContext } from "../../types.js";

import { cleanupAISDKMocks, createMockPlanResponse, createMockScheduleResponse, setupAISDKMocks } from "../../tests/ai-agent-test-utils.js";
import { DefaultAIAgentService } from "./agent.js";

describe("defaultAIAgentService", () => {
  beforeEach(() => {
    setupAISDKMocks();
  });

  afterEach(() => {
    cleanupAISDKMocks();
  });

  describe("planExecution", () => {
    it("should generate a valid execution plan", async () => {
      // Create the AI agent service with test config
      const aiAgent = new DefaultAIAgentService({
        model: "test-model",
        temperature: 0.2,
        maxRetries: 2,
        promptOptimization: { enabled: true, maxMessages: 10, minRecentMessages: 3, maxEndpointUsageEntries: 5 },
      });

      // Create a mock job context
      const jobContext: JobContext = {
        job: {
          id: "job-1",
          definitionNL: "Check the weather in New York and send a notification if it's raining",
          status: "ACTIVE",
          locked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        endpoints: [
          {
            id: "weather-api",
            name: "Weather API",
            url: "https://api.weather.com/forecast",
            method: "GET",
            timeoutMs: 5000,
            fireAndForget: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: "notification-api",
            name: "Notification API",
            url: "https://api.notify.com/send",
            method: "POST",
            timeoutMs: 3000,
            fireAndForget: false,
            createdAt: new Date().toISOString(),
          },
        ],
        messages: [],
        endpointUsage: [],
        executionContext: {
          currentTime: new Date().toISOString(),
          systemEnvironment: "test",
        },
      };

      // Call the planExecution method
      const plan = await aiAgent.planExecution(jobContext);

      // Verify the result matches our mock response
      expect(plan).toHaveProperty("endpointsToCall");
      expect(plan.executionStrategy).toBe("sequential");
      expect(plan.reasoning).toBeDefined();
      expect(plan.confidence).toBeGreaterThan(0);

      // This should match our mock response in ai-agent-test-utils.ts
      const mockPlan = { ...createMockPlanResponse(), usage: { inputTokens: 25, outputTokens: 40, totalTokens: 65 } };
      expect(plan).toEqual(mockPlan);
    });

    it("should handle errors during execution planning", async () => {
      // Create the AI agent service
      const aiAgent = new DefaultAIAgentService({
        model: "test-model",
      });

      // Mock the generateObject function to throw an error
      const generateObjectMock = vi.fn().mockRejectedValue(new Error("API error"));
      const generateObjectOriginal = await import("ai").then(m => m.generateObject);
      vi.spyOn(await import("ai"), "generateObject").mockImplementation(generateObjectMock);

      try {
        // Create a minimal job context
        const jobContext: JobContext = {
          job: {
            id: "job-error",
            definitionNL: "Test job",
            status: "ACTIVE",
            locked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          endpoints: [],
          messages: [],
          endpointUsage: [],
        };

        // Check that the error is properly caught and rethrown
        await expect(aiAgent.planExecution(jobContext))
          .rejects
          .toThrow("Error in planExecution: API error");
      }
      finally {
        // Restore the original function
        vi.spyOn(await import("ai"), "generateObject").mockImplementation(generateObjectOriginal);
      }
    });
  });

  describe("finalizeSchedule", () => {
    it("should generate a valid scheduling decision", async () => {
      // Create the AI agent service with test config
      const aiAgent = new DefaultAIAgentService({
        model: "test-model",
        temperature: 0.2,
        maxRetries: 2,
        promptOptimization: { enabled: true, maxMessages: 10, minRecentMessages: 3, maxEndpointUsageEntries: 5 },
      });

      // Mock the generateObject function to return our mock schedule response
      const mockScheduleResponse = createMockScheduleResponse();
      const generateObjectMock = vi.fn().mockResolvedValue({
        object: mockScheduleResponse,
        text: JSON.stringify(mockScheduleResponse),
        usage: { inputTokens: 30, outputTokens: 35, totalTokens: 65 },
        finishReason: "stop",
      });
      const generateObjectOriginal = await import("ai").then(m => m.generateObject);
      vi.spyOn(await import("ai"), "generateObject").mockImplementation(generateObjectMock);

      try {
        // Create a mock job context
        const jobContext: JobContext = {
          job: {
            id: "job-1",
            definitionNL: "Check the weather in New York every morning",
            status: "ACTIVE",
            locked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          endpoints: [
            {
              id: "weather-api",
              name: "Weather API",
              url: "https://api.weather.com/forecast",
              method: "GET",
              timeoutMs: 5000,
              fireAndForget: false,
              createdAt: new Date().toISOString(),
            },
          ],
          messages: [],
          endpointUsage: [],
          executionContext: {
            currentTime: new Date().toISOString(),
            systemEnvironment: "test",
          },
        };

        // Create mock execution results
        const executionResults: ExecutionResults = {
          results: [
            {
              endpointId: "weather-api",
              success: true,
              statusCode: 200,
              responseContent: {
                temperature: 72,
                conditions: "sunny",
                forecast: "clear skies",
              },
              executionTimeMs: 250,
              timestamp: new Date().toISOString(),
            },
          ],
          summary: {
            startTime: new Date(Date.now() - 1000).toISOString(),
            endTime: new Date().toISOString(),
            totalDurationMs: 1000,
            successCount: 1,
            failureCount: 0,
          },
        };

        // Call the finalizeSchedule method
        const schedule = await aiAgent.finalizeSchedule(jobContext, executionResults);

        // Verify the result matches our mock response
        expect(schedule).toHaveProperty("nextRunAt");
        expect(schedule.reasoning).toBeDefined();
        expect(schedule.confidence).toBeGreaterThan(0);

        // Compare with our mock response structure
        expect(schedule.recommendedActions).toEqual(mockScheduleResponse.recommendedActions);
        expect(schedule.confidence).toEqual(mockScheduleResponse.confidence);
        expect(schedule.reasoning).toEqual(mockScheduleResponse.reasoning);
        expect(new Date(schedule.nextRunAt).getTime()).toBeGreaterThan(Date.now());
      }
      finally {
        // Restore the original function
        vi.spyOn(await import("ai"), "generateObject").mockImplementation(generateObjectOriginal);
      }
    });

    it("should handle errors during schedule finalization", async () => {
      // Create the AI agent service
      const aiAgent = new DefaultAIAgentService({
        model: "test-model",
      });

      // Mock the generateObject function to throw an error
      const generateObjectMock = vi.fn().mockRejectedValue(new Error("Scheduling error"));
      const generateObjectOriginal = await import("ai").then(m => m.generateObject);
      vi.spyOn(await import("ai"), "generateObject").mockImplementation(generateObjectMock);

      try {
        // Create minimal job context and execution results
        const jobContext: JobContext = {
          job: {
            id: "job-error",
            definitionNL: "Test job",
            status: "ACTIVE",
            locked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          endpoints: [],
          messages: [],
          endpointUsage: [],
        };

        const executionResults: ExecutionResults = {
          results: [],
          summary: {
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            totalDurationMs: 0,
            successCount: 0,
            failureCount: 0,
          },
        };

        // Check that the error is properly caught and rethrown
        await expect(aiAgent.finalizeSchedule(jobContext, executionResults))
          .rejects
          .toThrow("Error in finalizeSchedule: Scheduling error");
      }
      finally {
        // Restore the original function
        vi.spyOn(await import("ai"), "generateObject").mockImplementation(generateObjectOriginal);
      }
    });
  });

  describe("prompt optimization", () => {
    it("optimizes messages and endpoint usage per config", () => {
      const aiAgent = new DefaultAIAgentService({
        model: "test-model",
        temperature: 0.2,
        maxRetries: 2,
        promptOptimization: { enabled: true, maxMessages: 5, minRecentMessages: 2, maxEndpointUsageEntries: 2 },
      });
      const jobContext: JobContext = {
        job: { id: "job-opt", definitionNL: "def", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        endpoints: [],
        messages: Array.from({ length: 12 }).map((_, i) => ({ id: `m${i}`, role: i % 5 === 0 ? "system" as const : "user" as const, content: `msg-${i}`, timestamp: new Date().toISOString() })),
        endpointUsage: Array.from({ length: 6 }).map((_, i) => ({ id: `u${i}`, endpointId: "e", timestamp: new Date().toISOString(), executionTimeMs: 10, success: 1 })),
      };
      const optimized = (aiAgent as any).optimizeContext(jobContext);
      expect(optimized.messages.length).toBeLessThanOrEqual(5);
      expect(optimized.endpointUsage.length).toBeLessThanOrEqual(2);
      // ensure at least minRecentMessages respected when available
      const nonSystem = optimized.messages.filter((m: any) => m.role !== "system");
      expect(nonSystem.length).toBeGreaterThanOrEqual(2);
    });
  });
});
