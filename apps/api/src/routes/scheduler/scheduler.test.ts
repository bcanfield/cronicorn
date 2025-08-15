import { eq } from "drizzle-orm";
import { testClient } from "hono/testing";
import { beforeAll, describe, expect, it } from "vitest";

import db from "@/api/db/index.js";
import resetDb from "@/api/db/reset.js";
import { endpointResults, endpoints, jobErrors, jobExecutions, jobs as jobsTable, messages } from "@/api/db/schema.js";
import { users } from "@/api/db/schema/auth.js";
import env from "@/api/env.js";
import createApp from "@/api/lib/create-app.js";

import router from "./scheduler.index.js";

if (env.NODE_ENV !== "test") {
  throw new Error("NODE_ENV must be 'test'");
}

const client = testClient(createApp().route("/", router));

describe("scheduler routes", () => {
  let testUserId: string;
  let testJobId: string;
  let testEndpointId: string;

  beforeAll(async () => {
    await resetDb();

    // Create test user
    const [user] = await db.insert(users).values({ email: "test@scheduler.com" }).returning();
    testUserId = user.id;

    // Create test job
    const [job] = await db.insert(jobsTable).values({
      definitionNL: "Test scheduler job",
      userId: testUserId,
      status: "ACTIVE",
      nextRunAt: new Date(Date.now() - 1000).toISOString(), // Past due
    }).returning();
    testJobId = job.id;

    // Create test endpoint
    const [endpoint] = await db.insert(endpoints).values({
      jobId: testJobId,
      name: "Test Endpoint",
      url: "https://api.example.com/test",
      method: "GET",
    }).returning();
    testEndpointId = endpoint.id;

    // Create test messages
    await db.insert(messages).values([
      {
        jobId: testJobId,
        role: "system",
        content: "System message for testing",
        source: "scheduler",
      },
      {
        jobId: testJobId,
        role: "user",
        content: "User message for testing",
      },
    ]);
  });

  describe("get /scheduler/jobs-to-process", () => {
    it("should return jobs that need processing", async () => {
      const response = await client.api.scheduler["jobs-to-process"].$get({
        query: { limit: "10" },
      });

      expect(response.status).toBe(200);
      if (response.status === 200) {
        const json = await response.json();
        expect(json.jobIds).toBeInstanceOf(Array);
        expect(json.jobIds).toContain(testJobId);
      }
    });

    it("should validate limit parameter", async () => {
      const response = await client.api.scheduler["jobs-to-process"].$get({
        query: { limit: "invalid" },
      });

      expect(response.status).toBe(422);
    });

    it("should respect limit parameter", async () => {
      const response = await client.api.scheduler["jobs-to-process"].$get({
        query: { limit: "1" },
      });

      expect(response.status).toBe(200);
      if (response.status === 200) {
        const json = await response.json();
        expect(json.jobIds.length).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("post /scheduler/jobs/lock", () => {
    it("should lock a job successfully", async () => {
      const expiresAt = new Date(Date.now() + 300000).toISOString(); // 5 minutes from now

      const response = await client.api.scheduler.jobs.lock.$post({
        json: {
          jobId: testJobId,
          expiresAt,
        },
      });

      expect(response.status).toBe(200);
      if (response.status === 200) {
        const json = await response.json();
        expect(json.success).toBe(true);
      }

      // Verify job is locked in database
      const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, testJobId));
      expect(job.locked).toBe(true);
      // Database stores timestamps in YYYY-MM-DD HH:MM:SS.sss format
      const expectedFormat = expiresAt.replace("T", " ").replace("Z", "");
      expect(job.lockExpiresAt).toBe(expectedFormat);
    });
  });

  describe("get /scheduler/jobs/:id/context", () => {
    it("should return complete job context", async () => {
      const response = await client.api.scheduler.jobs[":id"].context.$get({
        param: { id: testJobId },
      });

      expect(response.status).toBe(200);
      if (response.status === 200) {
        const json = await response.json();

        // Verify job data
        expect(json.job.id).toBe(testJobId);
        expect(json.job.definitionNL).toBe("Test scheduler job");

        // Verify endpoints
        expect(json.endpoints).toBeInstanceOf(Array);
        expect(json.endpoints.length).toBe(1);
        expect(json.endpoints[0].id).toBe(testEndpointId);

        // Verify messages
        expect(json.messages).toBeInstanceOf(Array);
        expect(json.messages.length).toBe(2);

        // Verify endpoint usage (should be empty initially)
        expect(json.endpointUsage).toBeInstanceOf(Array);

        // Verify execution context
        expect(json.executionContext).toBeDefined();
        expect(json.executionContext?.currentTime).toBeDefined();
        expect(json.executionContext?.systemEnvironment).toBe("test");
      }
    });

    it("should handle non-existent job", async () => {
      const response = await client.api.scheduler.jobs[":id"].context.$get({
        param: { id: "11111111-1111-1111-1111-111111111111" },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("post /scheduler/jobs/execution-plan", () => {
    it("should record execution plan successfully", async () => {
      const executionPlan = {
        endpointsToCall: [
          {
            endpointId: testEndpointId,
            parameters: { test: "value" },
            priority: 1,
            critical: true,
          },
        ],
        executionStrategy: "sequential" as const,
        reasoning: "Test execution plan",
        confidence: 0.8,
      };

      const response = await client.api.scheduler.jobs["execution-plan"].$post({
        json: {
          jobId: testJobId,
          plan: executionPlan,
        },
      });

      expect(response.status).toBe(200);
      if (response.status === 200) {
        const json = await response.json();
        expect(json.success).toBe(true);
      }

      // Verify execution plan was recorded
      const executions = await db.select().from(jobExecutions).where(eq(jobExecutions.jobId, testJobId));
      expect(executions.length).toBe(1);
      expect(executions[0].executionStrategy).toBe("sequential");
    });
  });

  describe("post /scheduler/jobs/endpoint-results", () => {
    it("should record endpoint results successfully", async () => {
      const endpointResultsData = [
        {
          jobId: testJobId,
          endpointId: testEndpointId,
          success: 1, // Integer: 1 for success, 0 for failure
          statusCode: 200,
          executionTimeMs: 1500,
          responseContent: JSON.stringify({ test: "response" }),
          requestSizeBytes: 100,
          responseSizeBytes: 200,
          truncated: 0, // Integer: 0 for not truncated, 1 for truncated
          error: null, // Add the error field as null for successful requests
        },
      ];

      const response = await client.api.scheduler.jobs["endpoint-results"].$post({
        json: endpointResultsData,
      });

      expect(response.status).toBe(200);
      if (response.status === 200) {
        const json = await response.json();
        expect(json.success).toBe(true);
      }

      // Verify endpoint results were recorded
      const results = await db.select().from(endpointResults).where(eq(endpointResults.jobId, testJobId));
      expect(results.length).toBe(1);
      expect(results[0].statusCode).toBe(200);
    });
  });

  describe("post /scheduler/jobs/execution-summary", () => {
    it("should record execution summary successfully", async () => {
      const summary = {
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        totalDurationMs: 2000,
        successCount: 1,
        failureCount: 0,
      };

      const response = await client.api.scheduler.jobs["execution-summary"].$post({
        json: {
          jobId: testJobId,
          summary,
        },
      });

      expect(response.status).toBe(200);
      if (response.status === 200) {
        const json = await response.json();
        expect(json.success).toBe(true);
      }
    });
  });

  describe("post /scheduler/jobs/schedule", () => {
    it("should update job schedule successfully", async () => {
      const schedule = {
        nextRunAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        reasoning: "Schedule for next hour based on results",
        confidence: 0.9,
      };

      const response = await client.api.scheduler.jobs.schedule.$post({
        json: {
          jobId: testJobId,
          schedule,
        },
      });

      expect(response.status).toBe(200);
      if (response.status === 200) {
        const json = await response.json();
        expect(json.success).toBe(true);
      }

      // Verify schedule was updated
      const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, testJobId));
      const expectedFormat = schedule.nextRunAt.replace("T", " ").replace("Z", "");
      expect(job.nextRunAt).toBe(expectedFormat);
    });
  });

  describe("post /scheduler/jobs/error", () => {
    it("should record job error successfully", async () => {
      const error = {
        jobId: testJobId,
        error: "Test error message",
        errorCode: "TEST_ERROR",
      };

      const response = await client.api.scheduler.jobs.error.$post({
        json: error,
      });

      expect(response.status).toBe(200);
      if (response.status === 200) {
        const json = await response.json();
        expect(json.success).toBe(true);
      }

      // Verify error was recorded
      const errors = await db.select().from(jobErrors).where(eq(jobErrors.jobId, testJobId));
      expect(errors.length).toBeGreaterThan(0);
      const lastError = errors[errors.length - 1];
      expect(lastError.errorMessage).toBe("Test error message");
      expect(lastError.errorCode).toBe("TEST_ERROR");
    });
  });

  describe("get /scheduler/metrics", () => {
    it("should return engine metrics", async () => {
      const response = await client.api.scheduler.metrics.$get();

      expect(response.status).toBe(200);
      if (response.status === 200) {
        const json = await response.json();
        expect(typeof json.activeJobs).toBe("number");
        expect(typeof json.jobsProcessedLastHour).toBe("number");
        expect(typeof json.avgProcessingTimeMs).toBe("number");
        expect(typeof json.errorRate).toBe("number");

        // Metrics should be non-negative
        expect(json.activeJobs).toBeGreaterThanOrEqual(0);
        expect(json.jobsProcessedLastHour).toBeGreaterThanOrEqual(0);
        expect(json.avgProcessingTimeMs).toBeGreaterThanOrEqual(0);
        expect(json.errorRate).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
