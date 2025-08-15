import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { executionPlanSchema, selectEndpointResultsSchema, selectEndpointsSchema, selectEndpointUsageSchema, selectJobsSchema, selectMessagesSchema } from "@/api/db/schema";
import { notFoundSchema } from "@/api/lib/constants";

const tags = ["Scheduler"];

/**
 * Schema for jobs that need processing
 */
const jobsToProcessResponseSchema = z.object({
  jobIds: z.array(z.string().uuid()).describe("Array of job IDs to process"),
});

/**
 * Schema for job context retrieval
 */
const jobContextSchema = z.object({
  job: selectJobsSchema,
  endpoints: z.array(selectEndpointsSchema),
  messages: z.array(selectMessagesSchema),
  endpointUsage: z.array(selectEndpointUsageSchema),
  executionContext: z.object({
    currentTime: z.string().datetime(),
    systemEnvironment: z.enum(["production", "development", "test"]),
    resourceConstraints: z.object({
      maxEndpointConcurrency: z.number(),
      maxExecutionTimeMs: z.number(),
    }).optional(),
  }).optional(),
});

/**
 * Schema for locking or unlocking a job
 */
const jobLockSchema = z.object({
  jobId: z.string().uuid(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * Schema for recording execution plan
 */
const recordExecutionPlanSchema = z.object({
  jobId: z.string().uuid(),
  plan: executionPlanSchema,
});

/**
 * Schema for recording endpoint results - array of results each with jobId
 */
const recordEndpointResultsSchema = z.array(
  selectEndpointResultsSchema.omit({ id: true, timestamp: true }).extend({
    jobId: z.string().uuid(),
  }),
);

/**
 * Schema for recording execution summary
 */
const executionSummarySchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  totalDurationMs: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
});

const recordExecutionSummarySchema = z.object({
  jobId: z.string().uuid(),
  summary: executionSummarySchema,
});

/**
 * Schema for updating job schedule
 */
const aiAgentScheduleResponseSchema = z.object({
  nextRunAt: z.string().datetime(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  recommendedActions: z.array(z.object({
    type: z.string(),
    details: z.string(),
    priority: z.enum(["low", "medium", "high"]),
  })).optional(),
});

const updateJobScheduleSchema = z.object({
  jobId: z.string().uuid(),
  schedule: aiAgentScheduleResponseSchema,
});

/**
 * Schema for recording job error
 */
const recordJobErrorSchema = z.object({
  jobId: z.string().uuid(),
  error: z.string(),
  errorCode: z.string().optional(),
});

/**
 * Schema for engine metrics
 */
const engineMetricsSchema = z.object({
  activeJobs: z.number(),
  jobsProcessedLastHour: z.number(),
  avgProcessingTimeMs: z.number(),
  errorRate: z.number(),
});

/**
 * Routes definition
 */
export const getJobsToProcess = createRoute({
  path: "/scheduler/jobs-to-process",
  method: "get",
  tags,
  summary: "Get jobs that need processing",
  operationId: "getJobsToProcess",
  description: "Returns a list of job IDs that need to be processed by the scheduler",
  request: {
    query: z.object({
      limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      jobsToProcessResponseSchema,
      "Array of job IDs to process",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "API key authentication required",
    ),
  },
});

export const lockJob = createRoute({
  path: "/scheduler/jobs/lock",
  method: "post",
  tags,
  summary: "Lock a job for processing",
  operationId: "lockJob",
  description: "Locks a job to prevent concurrent processing by multiple scheduler instances",
  request: {
    body: jsonContentRequired(
      jobLockSchema,
      "Job ID to lock and optional expiration time",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ success: z.boolean() }),
      "Whether the job was successfully locked",
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ message: z.string() }),
      "The job is already locked by another process",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "API key authentication required",
    ),
  },
});

export const unlockJob = createRoute({
  path: "/scheduler/jobs/unlock",
  method: "post",
  tags,
  summary: "Unlock a job",
  operationId: "unlockJob",
  description: "Removes a lock from a job after processing is complete or failed",
  request: {
    body: jsonContentRequired(
      jobLockSchema.omit({ expiresAt: true }),
      "Job ID to unlock",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ success: z.boolean() }),
      "Whether the job was successfully unlocked",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "API key authentication required",
    ),
  },
});

export const getJobContext = createRoute({
  path: "/scheduler/jobs/{id}/context",
  method: "get",
  tags,
  summary: "Get job context",
  operationId: "getJobContext",
  description: "Retrieves the complete context for a job, including endpoints, messages, and execution history",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      jobContextSchema,
      "Complete job context for processing",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "API key authentication required",
    ),
  },
});

export const recordExecutionPlan = createRoute({
  path: "/scheduler/jobs/execution-plan",
  method: "post",
  tags,
  summary: "Record execution plan",
  operationId: "recordExecutionPlan",
  description: "Records an execution plan from the AI agent for a job",
  request: {
    body: jsonContentRequired(
      recordExecutionPlanSchema,
      "Job ID and execution plan to record",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ success: z.boolean() }),
      "Whether the plan was successfully recorded",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "API key authentication required",
    ),
  },
});

export const recordEndpointResults = createRoute({
  path: "/scheduler/jobs/endpoint-results",
  method: "post",
  tags,
  summary: "Record endpoint results",
  operationId: "recordEndpointResults",
  description: "Records the results of endpoint executions for a job",
  request: {
    body: jsonContentRequired(
      recordEndpointResultsSchema,
      "Job ID and endpoint results to record",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ success: z.boolean() }),
      "Whether the results were successfully recorded",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "API key authentication required",
    ),
  },
});

export const recordExecutionSummary = createRoute({
  path: "/scheduler/jobs/execution-summary",
  method: "post",
  tags,
  summary: "Record execution summary",
  operationId: "recordExecutionSummary",
  description: "Records the execution summary for a job after processing is complete",
  request: {
    body: jsonContentRequired(
      recordExecutionSummarySchema,
      "Job ID and execution summary to record",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ success: z.boolean() }),
      "Whether the summary was successfully recorded",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "API key authentication required",
    ),
  },
});

export const updateJobSchedule = createRoute({
  path: "/scheduler/jobs/schedule",
  method: "post",
  tags,
  summary: "Update job schedule",
  operationId: "updateJobSchedule",
  description: "Updates the schedule for a job based on AI agent recommendations",
  request: {
    body: jsonContentRequired(
      updateJobScheduleSchema,
      "Job ID and schedule to update",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ success: z.boolean() }),
      "Whether the schedule was successfully updated",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "API key authentication required",
    ),
  },
});

export const recordJobError = createRoute({
  path: "/scheduler/jobs/error",
  method: "post",
  tags,
  summary: "Record job error",
  operationId: "recordJobError",
  description: "Records an error that occurred during job processing",
  request: {
    body: jsonContentRequired(
      recordJobErrorSchema,
      "Job ID, error message, and optional error code",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ success: z.boolean() }),
      "Whether the error was successfully recorded",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "API key authentication required",
    ),
  },
});

export const getEngineMetrics = createRoute({
  path: "/scheduler/metrics",
  method: "get",
  tags,
  summary: "Get engine metrics",
  operationId: "getEngineMetrics",
  description: "Retrieves metrics about the scheduler engine's performance",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      engineMetricsSchema,
      "Engine metrics data",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "API key authentication required",
    ),
  },
});

export type GetJobsToProcessRoute = typeof getJobsToProcess;
export type LockJobRoute = typeof lockJob;
export type UnlockJobRoute = typeof unlockJob;
export type GetJobContextRoute = typeof getJobContext;
export type RecordExecutionPlanRoute = typeof recordExecutionPlan;
export type RecordEndpointResultsRoute = typeof recordEndpointResults;
export type RecordExecutionSummaryRoute = typeof recordExecutionSummary;
export type UpdateJobScheduleRoute = typeof updateJobSchedule;
export type RecordJobErrorRoute = typeof recordJobError;
export type GetEngineMetricsRoute = typeof getEngineMetrics;
