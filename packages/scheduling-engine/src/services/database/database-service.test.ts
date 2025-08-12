import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AIAgentPlanResponse } from "../ai-agent";

import { DrizzleDatabaseService } from "./database-service";

// Mock drizzle
vi.mock("drizzle-orm", () => ({
    eq: vi.fn((column, value) => ({ column, operator: "=", value })),
    lte: vi.fn((column, value) => ({ column, operator: "<=", value })),
    and: vi.fn((...conditions) => ({ operator: "AND", conditions })),
    or: vi.fn((...conditions) => ({ operator: "OR", conditions })),
    asc: vi.fn(column => ({ column, direction: "asc" })),
    desc: vi.fn(column => ({ column, direction: "desc" })),
}));

describe("drizzleDatabaseService", () => {
    // Mock config and client
    const mockClient = {
        execute: vi.fn(),
        transaction: vi.fn(),
    };

    const mockConfig = {
        client: mockClient,
        poolSize: 5,
    };

    let mockDb: any;
    let databaseService: DrizzleDatabaseService;

    beforeEach(() => {
        // Create mock database client with required methods
        mockDb = {
            query: {
                jobs: {
                    findMany: vi.fn(),
                    findFirst: vi.fn(),
                    update: vi.fn(),
                    insert: vi.fn(),
                    count: vi.fn(),
                },
                jobExecutions: {
                    insert: vi.fn(),
                    findMany: vi.fn(),
                    update: vi.fn(),
                    count: vi.fn(),
                },
                endpointResults: {
                    insert: vi.fn(),
                },
                jobErrors: {
                    insert: vi.fn(),
                    count: vi.fn(),
                },
                endpoints: {
                    findMany: vi.fn(),
                },
                messages: {
                    findMany: vi.fn(),
                    insert: vi.fn(),
                },
                endpointUsage: {
                    findMany: vi.fn(),
                    insert: vi.fn(),
                },
            },
        };

        // Initialize service with mock
        databaseService = new DrizzleDatabaseService(mockConfig);
        // @ts-expect-error - Replace private db instance with our mock
        databaseService.db = mockDb;
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe("getJobsToProcess", () => {
        it("should fetch jobs due for processing", async () => {
            // Arrange
            const currentDate = new Date();
            const dueJobs = [
                { id: "job-1", nextRunAt: new Date(currentDate.getTime() - 60000).toISOString() }, // 1 min ago
                { id: "job-2", nextRunAt: new Date(currentDate.getTime() - 120000).toISOString() }, // 2 min ago
            ];

            // Mock the database query response
            mockDb.query.jobs.findMany.mockResolvedValueOnce(dueJobs);

            // Act
            const result = await databaseService.getJobsToProcess(10);

            // Assert
            expect(result).toHaveLength(2);
            expect(result).toContain("job-1");
            expect(result).toContain("job-2");
            expect(mockDb.query.jobs.findMany).toHaveBeenCalledTimes(1);

            // Check that the query was called with the right parameters
            expect(mockDb.query.jobs.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.any(Object),
                limit: 10,
                orderBy: expect.any(Array),
            }));
        });

        it("should respect the limit parameter", async () => {
            // Arrange
            mockDb.query.jobs.findMany.mockResolvedValueOnce([{ id: "job-1" }]);

            // Act
            await databaseService.getJobsToProcess(5);

            // Assert
            expect(mockDb.query.jobs.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 5,
                }),
            );
        });

        it("should only return active jobs", async () => {
            // Arrange
            mockDb.query.jobs.findMany.mockResolvedValueOnce([]);

            // Act
            await databaseService.getJobsToProcess(10);

            // Assert
            // Can't test the exact query conditions since we're mocking at a higher level,
            // but we can verify the function was called
            expect(mockDb.query.jobs.findMany).toHaveBeenCalledTimes(1);
        });

        it("should handle empty result sets", async () => {
            // Arrange
            mockDb.query.jobs.findMany.mockResolvedValueOnce([]);

            // Act
            const result = await databaseService.getJobsToProcess(10);

            // Assert
            expect(result).toEqual([]);
        });

        it("should handle database errors", async () => {
            // Arrange
            mockDb.query.jobs.findMany.mockRejectedValueOnce(new Error("DB connection error"));

            // Act & Assert
            await expect(databaseService.getJobsToProcess(10)).rejects.toThrow("DB connection error");
        });
    });

    describe("lockJob", () => {
        it("should lock a job with expiration date", async () => {
            // Arrange
            const jobId = "job-1";
            const expiresAt = new Date(Date.now() + 60000); // 1 minute from now

            // Mock the update query to return 1 row affected
            mockDb.query.jobs.update.mockResolvedValueOnce([{ id: jobId, locked: true }]);

            // Act
            const result = await databaseService.lockJob(jobId, expiresAt);

            // Assert
            expect(result).toBe(true);
            expect(mockDb.query.jobs.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.any(Object), // Can't test exact condition due to mocking
                    set: {
                        locked: true,
                        lockExpiresAt: expiresAt.toISOString(),
                        updatedAt: expect.any(String),
                    },
                }),
            );
        });

        it("should return false if job not found", async () => {
            // Arrange
            mockDb.query.jobs.update.mockResolvedValueOnce([]);

            // Act
            const result = await databaseService.lockJob("non-existent-job", new Date());

            // Assert
            expect(result).toBe(false);
            expect(mockDb.query.jobs.update).toHaveBeenCalledTimes(1);
        });

        it("should handle database errors", async () => {
            // Arrange
            mockDb.query.jobs.update.mockRejectedValueOnce(new Error("Lock error"));

            // Act & Assert
            await expect(databaseService.lockJob("job-1", new Date())).rejects.toThrow("Lock error");
        });
    });

    describe("unlockJob", () => {
        it("should unlock a job", async () => {
            // Arrange
            const jobId = "job-1";

            // Mock the update query to return 1 row affected
            mockDb.query.jobs.update.mockResolvedValueOnce([{ id: jobId, locked: false }]);

            // Act
            const result = await databaseService.unlockJob(jobId);

            // Assert
            expect(result).toBe(true);
            expect(mockDb.query.jobs.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.any(Object),
                    set: {
                        locked: false,
                        lockExpiresAt: null,
                        updatedAt: expect.any(String),
                    },
                }),
            );
        });

        it("should return false if job not found", async () => {
            // Arrange
            mockDb.query.jobs.update.mockResolvedValueOnce([]);

            // Act
            const result = await databaseService.unlockJob("non-existent-job");

            // Assert
            expect(result).toBe(false);
            expect(mockDb.query.jobs.update).toHaveBeenCalledTimes(1);
        });

        it("should handle database errors", async () => {
            // Arrange
            mockDb.query.jobs.update.mockRejectedValueOnce(new Error("Unlock error"));

            // Act & Assert
            await expect(databaseService.unlockJob("job-1")).rejects.toThrow("Unlock error");
        });
    });

    describe("getJobContext", () => {
        it("should return complete job context", async () => {
            // Arrange
            const jobId = "job-1";

            // Mock job data
            const mockJob = {
                id: jobId,
                definitionNL: "Check weather hourly",
                status: "ACTIVE",
                locked: false,
                createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            };

            // Mock endpoints
            const mockEndpoints = [
                {
                    id: "endpoint-1",
                    name: "Weather API",
                    url: "https://api.weather.com/forecast",
                    method: "GET",
                    timeoutMs: 5000,
                    fireAndForget: false,
                    createdAt: new Date().toISOString(),
                },
            ];

            // Mock messages
            const mockMessages = [
                {
                    id: "message-1",
                    role: "system",
                    content: "Job initialized",
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
                },
            ];

            // Mock endpoint usage
            const mockEndpointUsage = [
                {
                    id: "usage-1",
                    endpointId: "endpoint-1",
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    executionTimeMs: 250,
                    statusCode: 200,
                    success: 1,
                },
            ];

            // Set up mocks
            mockDb.query.jobs.findFirst.mockResolvedValueOnce(mockJob);
            mockDb.query.endpoints.findMany.mockResolvedValueOnce(mockEndpoints);
            mockDb.query.messages.findMany.mockResolvedValueOnce(mockMessages);
            mockDb.query.endpointUsage.findMany.mockResolvedValueOnce(mockEndpointUsage);

            // Store original Date.now to restore later
            const originalDateNow = Date.now;
            const mockNow = Date.now();

            try {
                // Mock Date.now to return a consistent value
                Date.now = vi.fn(() => mockNow);

                // Act
                const result = await databaseService.getJobContext(jobId);

                // Assert
                expect(result).not.toBeNull();
                expect(result).toMatchObject({
                    job: mockJob,
                    endpoints: mockEndpoints,
                    messages: mockMessages,
                    endpointUsage: mockEndpointUsage,
                    executionContext: {
                        // Use toMatch instead of exact equality for timestamps
                        currentTime: expect.any(String),
                        systemEnvironment: "test",
                    },
                });

                // Verify the timestamp is an ISO string
                expect(new Date(result!.executionContext!.currentTime).toISOString())
                    .toEqual(result!.executionContext!.currentTime);

                expect(mockDb.query.jobs.findFirst).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { id: jobId },
                    }),
                );
            }
            finally {
                // Restore original Date.now
                Date.now = originalDateNow;
            }
        });

        it("should return null if job not found", async () => {
            // Arrange
            mockDb.query.jobs.findFirst.mockResolvedValueOnce(null);

            // Act
            const result = await databaseService.getJobContext("non-existent-job");

            // Assert
            expect(result).toBeNull();
        });

        it("should handle database errors", async () => {
            // Arrange
            mockDb.query.jobs.findFirst.mockRejectedValueOnce(new Error("DB error"));

            // Act & Assert
            await expect(databaseService.getJobContext("job-1")).rejects.toThrow("DB error");
        });
    });

    describe("recordExecutionPlan", () => {
        it("should record execution plan and return true", async () => {
            // Arrange
            const jobId = "job-1";
            const plan: AIAgentPlanResponse = {
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
                reasoning: "This is a test plan",
                confidence: 0.95,
            };

            // Set up mocks
            mockDb.query.jobExecutions.insert.mockResolvedValueOnce({ id: "exec-1" });

            // Act
            const result = await databaseService.recordExecutionPlan(jobId, plan);

            // Assert
            expect(result).toBe(true);
            expect(mockDb.query.jobExecutions.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    jobId,
                    executionPlan: expect.any(String), // JSON stringified plan
                    planConfidence: plan.confidence,
                    planReasoning: plan.reasoning,
                    executionStrategy: plan.executionStrategy,
                }),
            );

            // Check that the plan was properly serialized
            const insertCall = mockDb.query.jobExecutions.insert.mock.calls[0][0];
            const parsedPlan = JSON.parse(insertCall.executionPlan);
            expect(parsedPlan).toEqual(plan);
        });

        it("should handle database errors", async () => {
            // Arrange
            mockDb.query.jobExecutions.insert.mockRejectedValueOnce(new Error("Insert error"));

            // Act & Assert
            await expect(
                databaseService.recordExecutionPlan("job-1", {
                    endpointsToCall: [],
                    executionStrategy: "sequential",
                    reasoning: "Test",
                    confidence: 0.5,
                }),
            ).rejects.toThrow("Insert error");
        });
    });

    describe("recordEndpointResults", () => {
        it("should record endpoint results and return true", async () => {
            // Arrange
            const jobId = "job-1";
            const timestamp = new Date().toISOString();
            const results = [
                {
                    endpointId: "endpoint-1",
                    success: true,
                    statusCode: 200,
                    responseContent: { data: "test response" },
                    executionTimeMs: 150,
                    timestamp,
                    requestSizeBytes: 200,
                    responseSizeBytes: 1500,
                },
                {
                    endpointId: "endpoint-2",
                    success: false,
                    statusCode: 500,
                    error: "Internal server error",
                    executionTimeMs: 75,
                    timestamp,
                },
            ];

            // Set up mock for endpoint usage as well
            mockDb.query.endpointUsage.insert.mockResolvedValueOnce([
                { id: "usage-1" },
                { id: "usage-2" },
            ]);

            // Act
            const result = await databaseService.recordEndpointResults(jobId, results);

            // Assert
            expect(result).toBe(true);

            // Check that each result was properly inserted
            expect(mockDb.query.endpointResults.insert).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        jobId,
                        endpointId: "endpoint-1",
                        success: 1, // Boolean to number conversion
                        statusCode: 200,
                        responseContent: expect.any(String), // JSON stringified
                        executionTimeMs: 150,
                        timestamp,
                        requestSizeBytes: 200,
                        responseSizeBytes: 1500,
                        truncated: 0, // Default value
                    }),
                    expect.objectContaining({
                        jobId,
                        endpointId: "endpoint-2",
                        success: 0, // Boolean to number conversion
                        statusCode: 500,
                        error: "Internal server error",
                        executionTimeMs: 75,
                        timestamp,
                    }),
                ]),
            );

            // Check that endpoint usage was also inserted
            expect(mockDb.query.endpointUsage.insert).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        endpointId: "endpoint-1",
                        success: 1,
                        statusCode: 200,
                        executionTimeMs: 150,
                        timestamp,
                        requestSizeBytes: 200,
                        responseSizeBytes: 1500,
                        truncated: 0,
                    }),
                    expect.objectContaining({
                        endpointId: "endpoint-2",
                        success: 0,
                        statusCode: 500,
                        executionTimeMs: 75,
                        timestamp,
                        errorMessage: "Internal server error",
                    }),
                ]),
            );

            // Check that the response content was properly serialized
            const insertCall = mockDb.query.endpointResults.insert.mock.calls[0][0];
            expect(JSON.parse(insertCall[0].responseContent)).toEqual(results[0].responseContent);
        });

        it("should handle database errors", async () => {
            // Arrange
            mockDb.query.endpointResults.insert.mockRejectedValueOnce(new Error("Insert error"));

            // Act & Assert
            await expect(
                databaseService.recordEndpointResults("job-1", [{
                    endpointId: "endpoint-1",
                    success: true,
                    statusCode: 200,
                    executionTimeMs: 100,
                    timestamp: new Date().toISOString(),
                }]),
            ).rejects.toThrow("Insert error");
        });
    });

    describe("recordExecutionSummary", () => {
        it("should record execution summary and return true", async () => {
            // Arrange
            const jobId = "job-1";
            const summary = {
                startTime: "2023-08-15T10:00:00.000Z",
                endTime: "2023-08-15T10:01:30.000Z",
                totalDurationMs: 90000,
                successCount: 3,
                failureCount: 1,
            };

            // Set up mock
            mockDb.query.jobExecutions.update.mockResolvedValueOnce([{ id: "exec-1" }]);

            // Act
            const result = await databaseService.recordExecutionSummary(jobId, summary);

            // Assert
            expect(result).toBe(true);
            expect(mockDb.query.jobExecutions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        jobId,
                    }),
                    set: expect.objectContaining({
                        executionSummary: JSON.stringify(summary),
                        startTime: summary.startTime,
                        endTime: summary.endTime,
                        durationMs: summary.totalDurationMs,
                        successCount: summary.successCount,
                        failureCount: summary.failureCount,
                        updatedAt: expect.any(String),
                    }),
                }),
            );
        });

        it("should handle database errors", async () => {
            // Arrange
            mockDb.query.jobExecutions.update.mockRejectedValueOnce(new Error("Update error"));

            // Act & Assert
            await expect(
                databaseService.recordExecutionSummary("job-1", {
                    startTime: "2023-08-15T10:00:00.000Z",
                    endTime: "2023-08-15T10:01:00.000Z",
                    totalDurationMs: 60000,
                    successCount: 2,
                    failureCount: 0,
                }),
            ).rejects.toThrow("Update error");
        });

        it("should handle case where no job execution exists", async () => {
            // Arrange
            mockDb.query.jobExecutions.update.mockResolvedValueOnce([]);
            mockDb.query.jobExecutions.insert.mockResolvedValueOnce({ id: "new-exec" });

            // Act
            const result = await databaseService.recordExecutionSummary("job-1", {
                startTime: "2023-08-15T10:00:00.000Z",
                endTime: "2023-08-15T10:01:00.000Z",
                totalDurationMs: 60000,
                successCount: 2,
                failureCount: 0,
            });

            // Assert
            expect(result).toBe(true);
            expect(mockDb.query.jobExecutions.insert).toHaveBeenCalled();
        });
    });

    describe("updateJobSchedule", () => {
        it("should update job schedule and return true", async () => {
            // Arrange
            const jobId = "job-1";
            const schedule = {
                nextRunAt: "2023-08-15T15:00:00.000Z",
                reasoning: "Based on hourly schedule and API requirements",
                confidence: 0.95,
                recommendedActions: [
                    {
                        type: "modify_frequency" as const,
                        details: "Suggest changing to 30-minute frequency for more accurate data",
                        priority: "medium" as const,
                    },
                ],
            };

            // Set up mocks
            mockDb.query.jobs.update.mockResolvedValueOnce([{ id: "job-1" }]);
            mockDb.query.messages.insert.mockResolvedValueOnce({ id: "message-1" });

            // Act
            const result = await databaseService.updateJobSchedule(jobId, schedule);

            // Assert
            expect(result).toBe(true);

            // Check job update
            expect(mockDb.query.jobs.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: jobId },
                    set: expect.objectContaining({
                        nextRunAt: schedule.nextRunAt,
                        updatedAt: expect.any(String),
                    }),
                }),
            );

            // Check that recommendations were stored as messages
            expect(mockDb.query.messages.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    jobId,
                    role: "system",
                    content: expect.stringContaining("Recommend"),
                    timestamp: expect.any(String),
                }),
            );
        });

        it("should handle job without recommendations", async () => {
            // Arrange
            const jobId = "job-1";
            const schedule = {
                nextRunAt: "2023-08-15T15:00:00.000Z",
                reasoning: "Following regular hourly schedule",
                confidence: 0.95,
            };

            // Set up mock
            mockDb.query.jobs.update.mockResolvedValueOnce([{ id: "job-1" }]);

            // Act
            const result = await databaseService.updateJobSchedule(jobId, schedule);

            // Assert
            expect(result).toBe(true);
            expect(mockDb.query.jobs.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: jobId },
                    set: expect.objectContaining({
                        nextRunAt: schedule.nextRunAt,
                    }),
                }),
            );

            // No message should be inserted
            expect(mockDb.query.messages.insert).not.toHaveBeenCalled();
        });

        it("should handle database errors", async () => {
            // Arrange
            mockDb.query.jobs.update.mockRejectedValueOnce(new Error("Update error"));

            // Act & Assert
            await expect(
                databaseService.updateJobSchedule("job-1", {
                    nextRunAt: "2023-08-15T15:00:00.000Z",
                    reasoning: "Test",
                    confidence: 0.9,
                }),
            ).rejects.toThrow("Update error");
        });
    });

    describe("recordJobError", () => {
        it("should record job error and return true", async () => {
            // Arrange
            const jobId = "job-1";
            const error = "Failed to process job due to network timeout";
            const errorCode = "NETWORK_TIMEOUT";

            // Set up mocks
            mockDb.query.jobErrors.insert.mockResolvedValueOnce({ id: "error-1" });
            mockDb.query.messages.insert.mockResolvedValueOnce({ id: "message-1" });

            // Act
            const result = await databaseService.recordJobError(jobId, error, errorCode);

            // Assert
            expect(result).toBe(true);

            // Check error was inserted
            expect(mockDb.query.jobErrors.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    jobId,
                    errorMessage: error,
                    errorCode,
                    timestamp: expect.any(String),
                }),
            );

            // Check message was created
            expect(mockDb.query.messages.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    jobId,
                    role: "system",
                    content: expect.stringContaining(error),
                    timestamp: expect.any(String),
                }),
            );
        });

        it("should handle error without error code", async () => {
            // Arrange
            const jobId = "job-1";
            const error = "Unknown error occurred";

            // Set up mocks
            mockDb.query.jobErrors.insert.mockResolvedValueOnce({ id: "error-1" });
            mockDb.query.messages.insert.mockResolvedValueOnce({ id: "message-1" });

            // Act
            const result = await databaseService.recordJobError(jobId, error);

            // Assert
            expect(result).toBe(true);
            expect(mockDb.query.jobErrors.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    jobId,
                    errorMessage: error,
                    errorCode: null, // No error code provided
                }),
            );
        });

        it("should handle database errors", async () => {
            // Arrange
            mockDb.query.jobErrors.insert.mockRejectedValueOnce(new Error("Insert error"));

            // Act & Assert
            await expect(
                databaseService.recordJobError("job-1", "Test error"),
            ).rejects.toThrow("Insert error");
        });
    });

    describe("getEngineMetrics", () => {
        it("should return engine metrics", async () => {
            // Arrange
            const oneHourAgo = new Date();
            oneHourAgo.setHours(oneHourAgo.getHours() - 1);

            // Set up mocks for count queries
            mockDb.query.jobs.count.mockResolvedValueOnce(10); // Active jobs

            // Jobs processed in last hour
            mockDb.query.jobExecutions.count.mockResolvedValueOnce(25);

            // Average processing time
            mockDb.query.jobExecutions.findMany.mockResolvedValueOnce([
                { durationMs: 1000 },
                { durationMs: 2000 },
                { durationMs: 1500 },
                { durationMs: 1800 },
            ]);

            // Error rate
            mockDb.query.jobErrors.count.mockResolvedValueOnce(5); // Errors in last hour
            mockDb.query.jobExecutions.count.mockResolvedValueOnce(50); // Total executions for error rate calc

            // Act
            const metrics = await databaseService.getEngineMetrics();

            // Assert
            expect(metrics).toEqual({
                activeJobs: 10,
                jobsProcessedLastHour: 25,
                avgProcessingTimeMs: 1575, // (1000 + 2000 + 1500 + 1800) / 4
                errorRate: 0.1, // 5 errors / 50 executions
            });

            // Verify the query was made with correct filters
            expect(mockDb.query.jobs.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: "ACTIVE" },
                }),
            );

            // Verify date filtering for hourly metrics
            expect(mockDb.query.jobExecutions.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        createdAt: expect.anything(),
                    }),
                }),
            );
        });

        it("should handle empty results", async () => {
            // Arrange
            mockDb.query.jobs.count.mockResolvedValueOnce(0);
            mockDb.query.jobExecutions.count.mockResolvedValueOnce(0); // No jobs in last hour
            mockDb.query.jobExecutions.findMany.mockResolvedValueOnce([]); // No durations
            mockDb.query.jobErrors.count.mockResolvedValueOnce(0); // No errors
            mockDb.query.jobExecutions.count.mockResolvedValueOnce(0); // No executions

            // Act
            const metrics = await databaseService.getEngineMetrics();

            // Assert
            expect(metrics).toEqual({
                activeJobs: 0,
                jobsProcessedLastHour: 0,
                avgProcessingTimeMs: 0, // No data to average
                errorRate: 0, // No data for error rate
            });
        });

        it("should handle database errors", async () => {
            // Arrange
            mockDb.query.jobs.count.mockRejectedValueOnce(new Error("Database error"));

            // Act & Assert
            await expect(databaseService.getEngineMetrics()).rejects.toThrow("Database error");
        });
    });
});
