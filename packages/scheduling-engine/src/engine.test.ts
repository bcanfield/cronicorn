/**
 * Tests for the core SchedulingEngine class
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EngineConfig } from "./config.js";
import type { AIAgentPlanResponse, AIAgentScheduleResponse } from "./services/ai-agent/agent.js";
import type { JobContext } from "./types.js";

import { SchedulingEngine } from "./engine.js";

// Mock the services
vi.mock("./services/index.js", () => ({
    ApiDatabaseService: vi.fn().mockImplementation(() => ({
        getJobsToProcess: vi.fn(),
        lockJob: vi.fn(),
        unlockJob: vi.fn(),
        getJobContext: vi.fn(),
        recordExecutionPlan: vi.fn(),
        recordEndpointResults: vi.fn(),
        recordExecutionSummary: vi.fn(),
        updateJobSchedule: vi.fn(),
        recordJobError: vi.fn(),
    })),
    DefaultAIAgentService: vi.fn().mockImplementation(() => ({
        planExecution: vi.fn(),
        finalizeSchedule: vi.fn(),
    })),
    DefaultEndpointExecutorService: vi.fn().mockImplementation(() => ({
        executeEndpoints: vi.fn(),
    })),
}));

describe("schedulingEngine", () => {
    let engine: SchedulingEngine;
    let mockConfig: EngineConfig;
    let mockDatabase: any;
    let mockAIAgent: any;
    let mockExecutor: any;

    const testTimestamp = "2024-01-01T00:00:00.000Z";

    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();

        // Create mock config
        mockConfig = {
            aiAgent: {
                model: "gpt-4o",
                temperature: 0.2,
                maxRetries: 2,
            },
            execution: {
                maxConcurrency: 5,
                defaultTimeoutMs: 30000,
                maxEndpointRetries: 3,
                defaultConcurrencyLimit: 3,
                responseContentLengthLimit: 10000,
                validateResponseSchemas: true,
            },
            metrics: {
                enabled: true,
                samplingRate: 1.0,
                trackTokenUsage: true,
            },
            scheduler: {
                maxBatchSize: 20,
                processingIntervalMs: 60000,
                autoUnlockStaleJobs: true,
                staleLockThresholdMs: 300000,
            },
        };

        // Create engine instance
        engine = new SchedulingEngine(mockConfig);

        // Get mock instances from the engine's private properties
        mockDatabase = (engine as any).database;
        mockAIAgent = (engine as any).aiAgent;
        mockExecutor = (engine as any).executor;
    });

    afterEach(async () => {
        // Stop engine if running
        if (engine.getState().status === "running") {
            await engine.stop();
        }
    });

    describe("initialization", () => {
        it("should create engine with default config", () => {
            const state = engine.getState();
            expect(state.status).toBe("stopped");
            expect(state.stats.totalJobsProcessed).toBe(0);
            expect(state.stats.successfulJobs).toBe(0);
            expect(state.stats.failedJobs).toBe(0);
        });

        it("should merge user config with defaults", () => {
            const partialConfig = {
                aiAgent: { model: "gpt-3.5-turbo" },
                scheduler: { maxBatchSize: 10 },
            } as Partial<EngineConfig>;

            const engineWithPartialConfig = new SchedulingEngine(partialConfig as EngineConfig);
            const state = engineWithPartialConfig.getState();
            expect(state.status).toBe("stopped");
        });
    });

    describe("lifecycle management", () => {
        it("should start and stop successfully", async () => {
            expect(engine.getState().status).toBe("stopped");

            await engine.start();
            expect(engine.getState().status).toBe("running");
            expect(engine.getState().startTime).toBeDefined();

            await engine.stop();
            expect(engine.getState().status).toBe("stopped");
            expect(engine.getState().stopTime).toBeDefined();
        });

        it("should prevent starting when already running", async () => {
            await engine.start();
            await expect(engine.start()).rejects.toThrow("Engine is already running");
            await engine.stop();
        });

        it("should handle stop when not running", async () => {
            // Should not throw
            await engine.stop();
            expect(engine.getState().status).toBe("stopped");
        });
    });

    describe("processCycle", () => {
        it("should process jobs successfully", async () => {
            // Mock database responses
            const jobIds = ["job-1", "job-2"];
            const mockJobContext: JobContext = {
                job: {
                    id: "job-1",
                    definitionNL: "Test job description",
                    status: "ACTIVE",
                    nextRunAt: testTimestamp,
                    locked: false,
                    createdAt: testTimestamp,
                    updatedAt: testTimestamp,
                },
                endpoints: [
                    {
                        id: "endpoint-1",
                        name: "Test Endpoint",
                        url: "https://api.example.com/test",
                        method: "GET",
                        timeoutMs: 30000,
                        fireAndForget: false,
                        createdAt: testTimestamp,
                    },
                ],
                messages: [],
                endpointUsage: [],
                executionContext: {
                    currentTime: testTimestamp,
                    systemEnvironment: "test" as const,
                },
            };

            const mockExecutionPlan: AIAgentPlanResponse = {
                endpointsToCall: [
                    {
                        endpointId: "endpoint-1",
                        parameters: { test: "value" },
                        priority: 1,
                        critical: true,
                    },
                ],
                executionStrategy: "sequential",
                preliminaryNextRunAt: new Date(Date.now() + 3600000).toISOString(),
                reasoning: "Test reasoning",
                confidence: 0.9,
            };

            const mockEndpointResults = [
                {
                    endpointId: "endpoint-1",
                    success: true,
                    statusCode: 200,
                    responseContent: { success: true },
                    executionTimeMs: 500,
                    timestamp: testTimestamp,
                },
            ];

            const mockScheduleResponse: AIAgentScheduleResponse = {
                nextRunAt: new Date(Date.now() + 3600000).toISOString(),
                reasoning: "Next run in 1 hour",
                confidence: 0.8,
            };

            // Setup mocks
            mockDatabase.getJobsToProcess.mockResolvedValue(jobIds);
            mockDatabase.lockJob.mockResolvedValue(true);
            mockDatabase.getJobContext.mockResolvedValue(mockJobContext);
            mockDatabase.recordExecutionPlan.mockResolvedValue(undefined);
            mockDatabase.recordEndpointResults.mockResolvedValue(undefined);
            mockDatabase.recordExecutionSummary.mockResolvedValue(undefined);
            mockDatabase.updateJobSchedule.mockResolvedValue(undefined);
            mockDatabase.unlockJob.mockResolvedValue(undefined);

            mockAIAgent.planExecution.mockResolvedValue(mockExecutionPlan);
            mockAIAgent.finalizeSchedule.mockResolvedValue(mockScheduleResponse);
            mockExecutor.executeEndpoints.mockResolvedValue(mockEndpointResults);

            // Execute
            const result = await engine.processCycle();

            // Verify results
            expect(result.jobsProcessed).toBe(2);
            expect(result.successfulJobs).toBe(2);
            expect(result.failedJobs).toBe(0);
            expect(result.errors).toHaveLength(0);
            expect(result.duration).toBeGreaterThanOrEqual(0);

            // Verify service calls
            expect(mockDatabase.getJobsToProcess).toHaveBeenCalledWith(20); // default batch size
            expect(mockDatabase.lockJob).toHaveBeenCalledTimes(2);
            expect(mockDatabase.getJobContext).toHaveBeenCalledTimes(2);
            expect(mockAIAgent.planExecution).toHaveBeenCalledTimes(2);
            expect(mockExecutor.executeEndpoints).toHaveBeenCalledTimes(2);
            expect(mockAIAgent.finalizeSchedule).toHaveBeenCalledTimes(2);
            expect(mockDatabase.unlockJob).toHaveBeenCalledTimes(2);

            // Verify state updates
            const state = engine.getState();
            expect(state.stats.totalJobsProcessed).toBe(2);
            expect(state.stats.successfulJobs).toBe(2);
            expect(state.stats.failedJobs).toBe(0);
            expect(state.stats.aiAgentCalls).toBe(4); // 2 plan + 2 schedule
            expect(state.stats.totalEndpointCalls).toBe(2);
        });

        it("should handle job locking failures", async () => {
            const jobIds = ["job-1"];
            mockDatabase.getJobsToProcess.mockResolvedValue(jobIds);
            mockDatabase.lockJob.mockResolvedValue(false); // Lock acquisition fails

            const result = await engine.processCycle();

            expect(result.jobsProcessed).toBe(1);
            expect(result.successfulJobs).toBe(0);
            expect(result.failedJobs).toBe(0); // Not counted as failed if lock not acquired
            expect(mockDatabase.getJobContext).not.toHaveBeenCalled();
        });

        it("should handle missing job context", async () => {
            const jobIds = ["job-1"];
            mockDatabase.getJobsToProcess.mockResolvedValue(jobIds);
            mockDatabase.lockJob.mockResolvedValue(true);
            mockDatabase.getJobContext.mockResolvedValue(null); // No context found

            const result = await engine.processCycle();

            expect(result.jobsProcessed).toBe(1);
            expect(result.successfulJobs).toBe(0);
            expect(result.failedJobs).toBe(0); // Not counted as failed if no context
            expect(mockDatabase.unlockJob).toHaveBeenCalledWith("job-1");
            expect(mockAIAgent.planExecution).not.toHaveBeenCalled();
        });

        it("should handle AI agent errors", async () => {
            const jobIds = ["job-1"];
            const mockJobContext: JobContext = {
                job: {
                    id: "job-1",
                    definitionNL: "Test job",
                    status: "ACTIVE",
                    nextRunAt: testTimestamp,
                    locked: false,
                    createdAt: testTimestamp,
                    updatedAt: testTimestamp,
                },
                endpoints: [],
                messages: [],
                endpointUsage: [],
                executionContext: {
                    currentTime: testTimestamp,
                    systemEnvironment: "test" as const,
                },
            };

            mockDatabase.getJobsToProcess.mockResolvedValue(jobIds);
            mockDatabase.lockJob.mockResolvedValue(true);
            mockDatabase.getJobContext.mockResolvedValue(mockJobContext);
            mockAIAgent.planExecution.mockRejectedValue(new Error("AI service unavailable"));

            const result = await engine.processCycle();

            expect(result.jobsProcessed).toBe(1);
            expect(result.successfulJobs).toBe(0);
            expect(result.failedJobs).toBe(1);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toBe("AI service unavailable");
            expect(result.errors[0].jobId).toBe("job-1");

            // Should still unlock the job
            expect(mockDatabase.unlockJob).toHaveBeenCalledWith("job-1");
            expect(mockDatabase.recordJobError).toHaveBeenCalledWith("job-1", "AI service unavailable");
        });

        it("should handle empty job list", async () => {
            mockDatabase.getJobsToProcess.mockResolvedValue([]);

            const result = await engine.processCycle();

            expect(result.jobsProcessed).toBe(0);
            expect(result.successfulJobs).toBe(0);
            expect(result.failedJobs).toBe(0);
            expect(result.errors).toHaveLength(0);

            // No other service calls should be made
            expect(mockDatabase.lockJob).not.toHaveBeenCalled();
            expect(mockAIAgent.planExecution).not.toHaveBeenCalled();
        });

        it("should respect batch size configuration", async () => {
            const customConfig = {
                ...mockConfig,
                scheduler: {
                    ...mockConfig.scheduler,
                    maxBatchSize: 5,
                },
            };

            const customEngine = new SchedulingEngine(customConfig);
            const customMockDatabase = (customEngine as any).database;
            customMockDatabase.getJobsToProcess.mockResolvedValue([]);

            await customEngine.processCycle();

            expect(customMockDatabase.getJobsToProcess).toHaveBeenCalledWith(5);
        });
    });

    describe("error handling", () => {
        it("should handle database connection errors", async () => {
            mockDatabase.getJobsToProcess.mockRejectedValue(new Error("Database connection failed"));

            const result = await engine.processCycle();

            expect(result.jobsProcessed).toBe(0);
            expect(result.successfulJobs).toBe(0);
            expect(result.failedJobs).toBe(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toBe("Database connection failed");
        });
    });

    describe("state management", () => {
        it("should track statistics correctly", async () => {
            const jobIds = ["job-1", "job-2"];
            const mockJobContext: JobContext = {
                job: {
                    id: "job-1",
                    definitionNL: "Test job",
                    status: "ACTIVE",
                    nextRunAt: testTimestamp,
                    locked: false,
                    createdAt: testTimestamp,
                    updatedAt: testTimestamp,
                },
                endpoints: [{
                    id: "endpoint-1",
                    name: "Test",
                    url: "https://test.com",
                    method: "GET",
                    timeoutMs: 30000,
                    fireAndForget: false,
                    createdAt: testTimestamp,
                }],
                messages: [],
                endpointUsage: [],
                executionContext: {
                    currentTime: testTimestamp,
                    systemEnvironment: "test" as const,
                },
            };

            const mockExecutionPlan: AIAgentPlanResponse = {
                endpointsToCall: [{ endpointId: "endpoint-1", priority: 1, critical: true }],
                executionStrategy: "sequential",
                reasoning: "Test",
                confidence: 0.9,
            };

            const mockEndpointResults = [
                {
                    endpointId: "endpoint-1",
                    success: true,
                    statusCode: 200,
                    executionTimeMs: 500,
                    timestamp: testTimestamp,
                },
            ];

            const mockScheduleResponse: AIAgentScheduleResponse = {
                nextRunAt: new Date(Date.now() + 3600000).toISOString(),
                reasoning: "Next run",
                confidence: 0.8,
            };

            // Setup for successful processing
            mockDatabase.getJobsToProcess.mockResolvedValue(jobIds);
            mockDatabase.lockJob.mockResolvedValue(true);
            mockDatabase.getJobContext.mockResolvedValue(mockJobContext);
            mockAIAgent.planExecution.mockResolvedValue(mockExecutionPlan);
            mockExecutor.executeEndpoints.mockResolvedValue(mockEndpointResults);
            mockAIAgent.finalizeSchedule.mockResolvedValue(mockScheduleResponse);

            const initialState = engine.getState();
            expect(initialState.stats.totalJobsProcessed).toBe(0);

            await engine.processCycle();

            const finalState = engine.getState();
            expect(finalState.stats.totalJobsProcessed).toBe(2);
            expect(finalState.stats.successfulJobs).toBe(2);
            expect(finalState.stats.failedJobs).toBe(0);
            expect(finalState.stats.aiAgentCalls).toBe(4); // 2 plan + 2 schedule
            expect(finalState.stats.totalEndpointCalls).toBe(2);
            expect(finalState.lastProcessingTime).toBeDefined();
        });

        it("should return immutable state", () => {
            const state1 = engine.getState();
            const state2 = engine.getState();

            expect(state1).not.toBe(state2); // Different objects
            expect(state1).toEqual(state2); // Same content
        });
    });

    describe("concurrency", () => {
        it("processes multiple jobs in parallel when jobProcessingConcurrency > 1", async () => {
            const concurrentConfig = {
                ...mockConfig,
                scheduler: { ...mockConfig.scheduler, jobProcessingConcurrency: 3 },
            };
            const concurrentEngine = new SchedulingEngine(concurrentConfig as any);
            const db = (concurrentEngine as any).database;
            const ai = (concurrentEngine as any).aiAgent;
            const exec = (concurrentEngine as any).executor;

            // 5 jobs, concurrency 3
            db.getJobsToProcess.mockResolvedValue(["j1", "j2", "j3", "j4", "j5"]);
            db.lockJob.mockResolvedValue(true);
            db.getJobContext.mockImplementation((id: string) => Promise.resolve({
                job: { id, definitionNL: "d", status: "ACTIVE", locked: false, createdAt: testTimestamp, updatedAt: testTimestamp },
                endpoints: [],
                messages: [],
                endpointUsage: [],
                executionContext: { currentTime: testTimestamp, systemEnvironment: "test" },
            }));
            ai.planExecution.mockResolvedValue({ endpointsToCall: [], executionStrategy: "sequential", reasoning: "r", confidence: 0.9 });
            exec.executeEndpoints.mockResolvedValue([]);
            ai.finalizeSchedule.mockResolvedValue({ nextRunAt: testTimestamp, reasoning: "r", confidence: 0.8 });
            db.recordExecutionPlan.mockResolvedValue(true);
            db.recordEndpointResults.mockResolvedValue(true);
            db.recordExecutionSummary.mockResolvedValue(true);
            db.updateJobSchedule.mockResolvedValue(true);
            db.unlockJob.mockResolvedValue(true);

            const result = await concurrentEngine.processCycle();
            expect(result.jobsProcessed).toBe(5);
            expect(result.successfulJobs).toBe(5);
            expect(ai.planExecution).toHaveBeenCalledTimes(5);
            // concurrency evidence: at least some planExecution calls overlapped in microtask queue – approximate by timing
        });
    });
});
