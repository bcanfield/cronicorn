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

        // Check that the error is properly caught and rethrown (now includes classification tag)
        await expect(aiAgent.planExecution(jobContext))
          .rejects
          .toThrow(/Error in planExecution \[schema_parse_error\]: API error/);
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

        // Check that the error is properly caught and rethrown (now includes classification tag)
        await expect(aiAgent.finalizeSchedule(jobContext, executionResults))
          .rejects
          .toThrow(/Error in finalizeSchedule \[schema_parse_error\]: Scheduling error/);
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

  describe("semantic validation", () => {
    it("fails planning with semantic issue when strict", async () => {
      const aiAgent = new DefaultAIAgentService({ model: "test-model", validateSemantics: true, semanticStrict: true });
      // mock generateObject to return invalid plan (parallel with concurrencyLimit 1)
      const invalidPlan = { endpointsToCall: [], executionStrategy: "parallel", concurrencyLimit: 1, reasoning: "r", confidence: 0.9 } as any;
      const generateObjectOriginal = await import("ai").then(m => m.generateObject);
      const mock = vi.spyOn(await import("ai"), "generateObject").mockResolvedValue({ object: invalidPlan, usage: {}, text: JSON.stringify(invalidPlan), finishReason: "stop" } as any);
      const ctx: JobContext = { job: { id: "j", definitionNL: "d", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [] };
      await expect(aiAgent.planExecution(ctx)).rejects.toThrow(/Semantic validation failed/);
      mock.mockRestore();
      vi.spyOn(await import("ai"), "generateObject").mockImplementation(generateObjectOriginal);
    });

    it("appends warnings when non-strict", async () => {
      const aiAgent = new DefaultAIAgentService({ model: "test-model", validateSemantics: true, semanticStrict: false });
      const invalidPlan = { endpointsToCall: [], executionStrategy: "parallel", concurrencyLimit: 1, reasoning: "r", confidence: 0.9 } as any;
      const generateObjectOriginal = await import("ai").then(m => m.generateObject);
      const mock = vi.spyOn(await import("ai"), "generateObject").mockResolvedValue({ object: invalidPlan, usage: {}, text: JSON.stringify(invalidPlan), finishReason: "stop" } as any);
      const ctx: JobContext = { job: { id: "j", definitionNL: "d", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [] };
      const plan = await aiAgent.planExecution(ctx);
      expect(plan.reasoning).toMatch(/SemanticWarnings/);
      mock.mockRestore();
      vi.spyOn(await import("ai"), "generateObject").mockImplementation(generateObjectOriginal);
    });
  });

  describe("malformed response handling", () => {
    it("repairs malformed plan when semantic failure occurs and repair enabled", async () => {
      const aiAgent = new DefaultAIAgentService({ model: "test-model", validateSemantics: true, semanticStrict: true, repairMalformedResponses: true });
      const invalidPlan = { endpointsToCall: [], executionStrategy: "parallel", concurrencyLimit: 1, reasoning: "r", confidence: 0.9 } as any; // triggers semantic error
      const validPlan = { endpointsToCall: [], executionStrategy: "parallel", concurrencyLimit: 2, reasoning: "fixed", confidence: 0.95 } as any;
      const generateObjectOriginal = await import("ai").then(m => m.generateObject);
      const mock = vi.spyOn(await import("ai"), "generateObject").mockImplementation(((..._args: any[]) => {
        // first call returns invalid, second returns valid
        if ((mock as any).callCount === undefined)
          (mock as any).callCount = 0;
        (mock as any).callCount++;
        if ((mock as any).callCount === 1) {
          return Promise.resolve({ object: invalidPlan, usage: {}, text: JSON.stringify(invalidPlan), finishReason: "stop" });
        }
        return Promise.resolve({ object: validPlan, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 }, text: JSON.stringify(validPlan), finishReason: "stop" });
      }) as any);
      const ctx: JobContext = { job: { id: "j-repair", definitionNL: "d", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [] };
      const plan = await aiAgent.planExecution(ctx);
      expect(plan.reasoning).toBe("fixed");
      expect(plan.executionStrategy).toBe("parallel");
      expect(plan.concurrencyLimit).toBe(2);
      mock.mockRestore();
      vi.spyOn(await import("ai"), "generateObject").mockImplementation(generateObjectOriginal);
    });

    it("repairs malformed schedule when semantic failure occurs and repair enabled", async () => {
      const aiAgent = new DefaultAIAgentService({ model: "test-model", validateSemantics: true, semanticStrict: true, repairMalformedResponses: true });
      const past = new Date(Date.now() - 60_000).toISOString();
      const future = new Date(Date.now() + 3_600_000).toISOString();
      const invalidSchedule = { nextRunAt: past, reasoning: "past", confidence: 0.8 } as any; // triggers semantic validator (not future)
      const validSchedule = { nextRunAt: future, reasoning: "future", confidence: 0.85 } as any;
      const generateObjectOriginal = await import("ai").then(m => m.generateObject);
      const mock = vi.spyOn(await import("ai"), "generateObject").mockImplementation(((..._args: any[]) => {
        if ((mock as any).callCount === undefined)
          (mock as any).callCount = 0;
        (mock as any).callCount++;
        if ((mock as any).callCount === 1) {
          return Promise.resolve({ object: invalidSchedule, usage: {}, text: JSON.stringify(invalidSchedule), finishReason: "stop" });
        }
        return Promise.resolve({ object: validSchedule, usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 }, text: JSON.stringify(validSchedule), finishReason: "stop" });
      }) as any);
      const ctx: JobContext = { job: { id: "j-sched", definitionNL: "d", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [] };
      const execResults: ExecutionResults = { results: [], summary: { startTime: new Date().toISOString(), endTime: new Date().toISOString(), totalDurationMs: 0, successCount: 0, failureCount: 0 } };
      const schedule = await aiAgent.finalizeSchedule(ctx, execResults);
      expect(schedule.nextRunAt).toBe(future);
      expect(schedule.reasoning).toBe("future");
      mock.mockRestore();
      vi.spyOn(await import("ai"), "generateObject").mockImplementation(generateObjectOriginal);
    });

    it("does not repair when repair feature disabled", async () => {
      const aiAgent = new DefaultAIAgentService({ model: "test-model", validateSemantics: true, semanticStrict: true, repairMalformedResponses: false });
      const invalidPlan = { endpointsToCall: [], executionStrategy: "parallel", concurrencyLimit: 1, reasoning: "r", confidence: 0.9 } as any;
      const generateObjectOriginal = await import("ai").then(m => m.generateObject);
      const mock = vi.spyOn(await import("ai"), "generateObject").mockResolvedValue({ object: invalidPlan, usage: {}, text: JSON.stringify(invalidPlan), finishReason: "stop" } as any);
      const ctx: JobContext = { job: { id: "j-no-repair", definitionNL: "d", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [] };
      await expect(aiAgent.planExecution(ctx)).rejects.toThrow(/Semantic validation failed/);
      mock.mockRestore();
      vi.spyOn(await import("ai"), "generateObject").mockImplementation(generateObjectOriginal);
    });

    it("adds classification tag on unrepaired semantic failure", async () => {
      const aiAgent = new DefaultAIAgentService({ model: "test-model", validateSemantics: true, semanticStrict: true, repairMalformedResponses: false });
      const invalidPlan = { endpointsToCall: [], executionStrategy: "parallel", concurrencyLimit: 1, reasoning: "r", confidence: 0.9 } as any; // semantic violation
      const generateObjectOriginal = await import("ai").then(m => m.generateObject);
      const mock = vi.spyOn(await import("ai"), "generateObject").mockResolvedValue({ object: invalidPlan, usage: {}, text: JSON.stringify(invalidPlan), finishReason: "stop" } as any);
      const ctx: JobContext = { job: { id: "j-cat", definitionNL: "d", status: "ACTIVE", locked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, endpoints: [], messages: [], endpointUsage: [] };
      await expect(aiAgent.planExecution(ctx)).rejects.toThrow(/\[semantic_violation\]/);
      mock.mockRestore();
      vi.spyOn(await import("ai"), "generateObject").mockImplementation(generateObjectOriginal);
    });
  });
});
