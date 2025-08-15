import { count, desc, eq, gte } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/api/lib/types";

import db from "@/api/db/index.js";
import {
  endpointResults,
  endpointUsage,
  jobErrors,
  jobExecutions,
  jobs,
  messages,
} from "@/api/db/schema.js";
import env from "@/api/env.js";

import type {
  GetEngineMetricsRoute,
  GetJobContextRoute,
  GetJobsToProcessRoute,
  LockJobRoute,
  RecordEndpointResultsRoute,
  RecordExecutionPlanRoute,
  RecordExecutionSummaryRoute,
  RecordJobErrorRoute,
  UnlockJobRoute,
  UpdateExecutionStatusRoute,
  UpdateJobScheduleRoute,
  UpdateJobTokenUsageRoute,
} from "./scheduler.routes.js";

/**
 * Get jobs that need processing
 */
export const getJobsToProcess: AppRouteHandler<GetJobsToProcessRoute> = async (c) => {
  // Auth check is handled by middleware
  const { limit } = c.req.valid("query");

  // Find active jobs that are not locked and are due to run
  const jobIdsToProcess = await db.query.jobs.findMany({
    where: (fields, { eq, lte, and }) => {
      return and(
        eq(fields.status, "ACTIVE"),
        eq(fields.locked, false),
        lte(fields.nextRunAt, new Date().toISOString()),
      );
    },
    columns: {
      id: true,
    },
    limit,
  });

  return c.json({ jobIds: jobIdsToProcess.map(job => job.id) }, HttpStatusCodes.OK);
};

/**
 * Lock a job for processing
 */
export const lockJob: AppRouteHandler<LockJobRoute> = async (c) => {
  const { jobId, expiresAt } = c.req.valid("json");

  // Check if job exists
  const jobExists = await db.query.jobs.findFirst({
    where: (fields, { eq }) => eq(fields.id, jobId),
    columns: { id: true, locked: true },
  });

  if (!jobExists) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  // If job is already locked, return conflict
  if (jobExists.locked) {
    return c.json({ message: "Job is already locked" }, HttpStatusCodes.CONFLICT);
  }

  // Lock the job
  const lockExpiresAt = expiresAt || new Date(Date.now() + 10 * 60 * 1000).toISOString(); // Default to 10 minutes

  const [updated] = await db.update(jobs)
    .set({
      locked: true,
      lockExpiresAt,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(jobs.id, jobId))
    .returning();

  return c.json({ success: !!updated }, HttpStatusCodes.OK);
};

/**
 * Unlock a job
 */
export const unlockJob: AppRouteHandler<UnlockJobRoute> = async (c) => {
  const { jobId } = c.req.valid("json");

  // Check if job exists
  const jobExists = await db.query.jobs.findFirst({
    where: (fields, { eq }) => eq(fields.id, jobId),
    columns: { id: true },
  });

  if (!jobExists) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  // Unlock the job
  const [updated] = await db.update(jobs)
    .set({
      locked: false,
      lockExpiresAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(jobs.id, jobId))
    .returning();

  return c.json({ success: !!updated }, HttpStatusCodes.OK);
};

/**
 * Get job context
 */
export const getJobContext: AppRouteHandler<GetJobContextRoute> = async (c) => {
  const { id } = c.req.valid("param");

  // Get job details
  const job = await db.query.jobs.findFirst({
    where: (fields, { eq }) => eq(fields.id, id),
  });

  if (!job) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  // Get all endpoints
  const allEndpointsRaw = await db.query.endpoints.findMany({});

  // Format endpoints to match expected schema
  const allEndpoints = allEndpointsRaw.map(endpoint => ({
    id: endpoint.id,
    name: endpoint.name,
    url: endpoint.url,
    method: endpoint.method,
    bearerToken: endpoint.bearerToken,
    requestSchema: endpoint.requestSchema,
    jobId: endpoint.jobId,
    timeoutMs: endpoint.timeoutMs,
    fireAndForget: endpoint.fireAndForget,
    maxRequestSizeBytes: endpoint.maxRequestSizeBytes,
    maxResponseSizeBytes: endpoint.maxResponseSizeBytes,
    createdAt: endpoint.createdAt,
    updatedAt: endpoint.updatedAt,
  })); // Get messages for this job
  const jobMessagesRaw = await db.query.messages.findMany({
    where: (fields, { eq }) => eq(fields.jobId, id),
    orderBy: (fields, { desc }) => desc(fields.createdAt),
  });

  // Format messages to match expected schema
  const jobMessages = jobMessagesRaw.map(message => ({
    id: message.id,
    role: message.role,
    content: message.content,
    jobId: message.jobId,
    source: message.source,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  })); // Get endpoint usage for this job
  const endpointUsageData = await db.query.endpointResults.findMany({
    where: (fields, { eq }) => eq(fields.jobId, id),
    columns: {
      id: true,
      endpointId: true,
      timestamp: true,
      requestSizeBytes: true,
      responseSizeBytes: true,
      executionTimeMs: true,
      statusCode: true,
      success: true,
      truncated: true,
      error: true, // Maps to errorMessage
    },
  });

  // Format endpoint usage to match expected schema
  const formattedEndpointUsage = endpointUsageData.map(usage => ({
    id: usage.id,
    endpointId: usage.endpointId,
    timestamp: usage.timestamp || new Date().toISOString(),
    requestSizeBytes: usage.requestSizeBytes || null,
    responseSizeBytes: usage.responseSizeBytes || null,
    executionTimeMs: usage.executionTimeMs || null,
    statusCode: usage.statusCode === null ? null : usage.statusCode,
    success: usage.success || 0,
    truncated: usage.truncated || null,
    errorMessage: usage.error || null,
  })); // Use a type-safe approach to determine environment
  // Get environment for execution context
  const nodeEnv: "development" | "production" | "test"
    = (env.NODE_ENV === "test"
      ? "test"
      : env.NODE_ENV === "production"
        ? "production"
        : "development") as "development" | "production" | "test";

  // Construct the context object
  const jobContext = {
    job: {
      id: job.id,
      definitionNL: job.definitionNL,
      nextRunAt: job.nextRunAt,
      status: job.status,
      locked: job.locked,
      lockExpiresAt: job.lockExpiresAt,
      userId: job.userId,
      inputTokens: job.inputTokens,
      outputTokens: job.outputTokens,
      totalTokens: job.totalTokens,
      reasoningTokens: job.reasoningTokens,
      cachedInputTokens: job.cachedInputTokens,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    },
    endpoints: allEndpoints,
    messages: jobMessages,
    endpointUsage: formattedEndpointUsage,
    executionContext: {
      currentTime: new Date().toISOString(),
      systemEnvironment: nodeEnv,
    },
  };

  return c.json(jobContext, HttpStatusCodes.OK);
};

/**
 * Record execution plan
 */
export const recordExecutionPlan: AppRouteHandler<RecordExecutionPlanRoute> = async (c) => {
  const { jobId, plan } = c.req.valid("json");

  // Check if job exists
  const jobExists = await db.query.jobs.findFirst({
    where: (fields, { eq }) => eq(fields.id, jobId),
    columns: { id: true },
  });

  if (!jobExists) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  // Insert execution plan
  await db.insert(jobExecutions).values({
    id: crypto.randomUUID(),
    jobId,
    executionPlan: JSON.stringify(plan),
    planConfidence: Math.round(plan.confidence * 100), // Convert 0-1 to 0-100
    planReasoning: plan.reasoning,
    executionStrategy: plan.executionStrategy,
    status: "PENDING", // Use status enum
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return c.json({ success: true }, HttpStatusCodes.OK);
};

/**
 * Record endpoint results
 */
export const recordEndpointResults: AppRouteHandler<RecordEndpointResultsRoute> = async (c) => {
  const results = c.req.valid("json");

  if (results.length === 0) {
    return c.json({ success: true }, HttpStatusCodes.OK);
  }

  // Validate that all results are for the same job (optional validation)
  const firstJobId = results[0]?.jobId;
  if (firstJobId) {
    // Check if job exists using the first result's jobId
    const jobExists = await db.query.jobs.findFirst({
      where: (fields, { eq }) => eq(fields.id, firstJobId),
      columns: { id: true },
    });

    if (!jobExists) {
      return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
    }
  }

  // Map results to endpoint results schema
  const endpointResultsToInsert = results.map(result => ({
    id: crypto.randomUUID(),
    jobId: result.jobId,
    endpointId: result.endpointId,
    success: result.success ? 1 : 0, // Convert boolean to 1/0 per schema
    statusCode: result.statusCode || null,
    responseContent: result.responseContent ? JSON.stringify(result.responseContent) : null,
    error: result.error || null,
    executionTimeMs: result.executionTimeMs || 0,
    timestamp: new Date().toISOString(),
    requestSizeBytes: result.requestSizeBytes || null,
    responseSizeBytes: result.responseSizeBytes || null,
    truncated: result.truncated ? 1 : 0, // Convert boolean to 1/0 per schema
  }));

  // Insert endpoint results
  await db.insert(endpointResults).values(endpointResultsToInsert);

  // Also record endpoint usage for analytics
  const endpointUsageToInsert = results.map(result => ({
    id: crypto.randomUUID(),
    endpointId: result.endpointId,
    timestamp: new Date().toISOString(),
    executionTimeMs: result.executionTimeMs || 0,
    statusCode: result.statusCode || null,
    success: result.success ? 1 : 0, // Convert boolean to 1/0 per schema
    errorMessage: result.error || null,
    requestSizeBytes: result.requestSizeBytes || null,
    responseSizeBytes: result.responseSizeBytes || null,
    truncated: result.truncated ? 1 : 0, // Convert boolean to 1/0 per schema
  }));

  // Insert endpoint usage
  await db.insert(endpointUsage).values(endpointUsageToInsert);

  return c.json({ success: true }, HttpStatusCodes.OK);
};/**
/**
   * Record execution summary
   */
export const recordExecutionSummary: AppRouteHandler<RecordExecutionSummaryRoute> = async (c) => {
  const { jobId, summary } = c.req.valid("json");

  // Check if job exists
  const jobExists = await db.query.jobs.findFirst({
    where: (fields, { eq }) => eq(fields.id, jobId),
    columns: { id: true },
  });

  if (!jobExists) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  // Find the most recent execution record for this job
  const recentExecution = await db.query.jobExecutions.findFirst({
    where: (fields, { eq }) => eq(fields.jobId, jobId),
    orderBy: (fields, { desc }) => desc(fields.createdAt),
  });

  if (recentExecution) {
    // Update existing execution record
    await db.update(jobExecutions)
      .set({
        executionSummary: JSON.stringify(summary),
        startTime: summary.startTime,
        endTime: summary.endTime,
        durationMs: summary.totalDurationMs,
        successCount: summary.successCount,
        failureCount: summary.failureCount,
        status: "COMPLETED", // Use status enum
        updatedAt: new Date().toISOString(),
      })
      .where(eq(jobExecutions.id, recentExecution.id));
  }
  else {
    // Create a new execution record
    await db.insert(jobExecutions).values({
      id: crypto.randomUUID(),
      jobId,
      executionSummary: JSON.stringify(summary),
      startTime: summary.startTime,
      endTime: summary.endTime,
      durationMs: summary.totalDurationMs,
      successCount: summary.successCount,
      failureCount: summary.failureCount,
      status: "COMPLETED", // Use status enum
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return c.json({ success: true }, HttpStatusCodes.OK);
};

/**
 * Update job schedule
 */
export const updateJobSchedule: AppRouteHandler<UpdateJobScheduleRoute> = async (c) => {
  const { jobId, schedule } = c.req.valid("json");

  // Check if job exists
  const jobExists = await db.query.jobs.findFirst({
    where: (fields, { eq }) => eq(fields.id, jobId),
    columns: { id: true },
  });

  if (!jobExists) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  // Update job with new next run time
  await db.update(jobs)
    .set({
      nextRunAt: schedule.nextRunAt,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(jobs.id, jobId));

  // If there are recommended actions, record them as system messages
  if (schedule.recommendedActions && schedule.recommendedActions.length > 0) {
    // Format recommendations as a message
    const content = `Recommended actions from schedule analysis:
${schedule.recommendedActions.map((action) => {
  return `- [${action.priority.toUpperCase()}] ${action.type}: ${action.details}`;
}).join("\n")}

Reasoning: ${schedule.reasoning}
Confidence: ${(schedule.confidence * 100).toFixed(0)}%`;

    // Store as a system message for the job
    await db.insert(messages).values({
      id: crypto.randomUUID(),
      jobId,
      role: "system",
      content,
      source: "scheduler", // Using a valid enum value
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return c.json({ success: true }, HttpStatusCodes.OK);
};

/**
 * Record job error
 */
export const recordJobError: AppRouteHandler<RecordJobErrorRoute> = async (c) => {
  const { jobId, error, errorCode } = c.req.valid("json");

  // Check if job exists
  const jobExists = await db.query.jobs.findFirst({
    where: (fields, { eq }) => eq(fields.id, jobId),
    columns: { id: true },
  });

  if (!jobExists) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  // Record error in job_errors table
  await db.insert(jobErrors).values({
    id: crypto.randomUUID(),
    jobId,
    errorMessage: error,
    errorCode: errorCode || null,
    timestamp: new Date().toISOString(),
  });

  // Also record as a system message for visibility in job context
  await db.insert(messages).values({
    id: crypto.randomUUID(),
    jobId,
    role: "system",
    content: `ERROR${errorCode ? ` [${errorCode}]` : ""}: ${error}`,
    source: "error-handler", // Using a valid enum value
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return c.json({ success: true }, HttpStatusCodes.OK);
};

/**
 * Get engine metrics
 */
export const getEngineMetrics: AppRouteHandler<GetEngineMetricsRoute> = async (c) => {
  // Get the timestamp for one hour ago
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  const oneHourAgoISO = oneHourAgo.toISOString();

  // Get the timestamp for one day ago
  const oneDayAgoISO = new Date(Date.now() - 86400000).toISOString();

  // Count active jobs
  const activeJobsResult = await db.select({ count: count() })
    .from(jobs)
    .where(eq(jobs.status, "ACTIVE"));
  const activeJobs = activeJobsResult[0]?.count || 0;

  // Count jobs processed in the last hour
  const jobsProcessedResult = await db.select({ count: count() })
    .from(jobExecutions)
    .where(gte(jobExecutions.createdAt, oneHourAgoISO));
  const jobsProcessedLastHour = jobsProcessedResult[0]?.count || 0;

  // Get average processing time from the last day, with known duration
  const recentExecutions = await db.select()
    .from(jobExecutions)
    .where(gte(jobExecutions.createdAt, oneDayAgoISO))
    .orderBy(desc(jobExecutions.createdAt))
    .limit(100);

  // Calculate average processing time
  let avgProcessingTimeMs = 0;
  if (recentExecutions.length > 0) {
    const totalDuration = recentExecutions.reduce(
      (sum: number, exec: any) => sum + (exec.durationMs || 0),
      0,
    );
    avgProcessingTimeMs = Math.round(totalDuration / recentExecutions.length);
  }

  // Count errors in the last hour
  const errorCountResult = await db.select({ count: count() })
    .from(jobErrors)
    .where(gte(jobErrors.timestamp, oneHourAgoISO));
  const errorCount = errorCountResult[0]?.count || 0;

  // Count total executions in the same period for error rate
  const totalExecutionsResult = await db.select({ count: count() })
    .from(jobExecutions)
    .where(gte(jobExecutions.createdAt, oneHourAgoISO));
  const totalExecutions = totalExecutionsResult[0]?.count || 0;

  // Calculate error rate (avoid division by zero)
  const errorRate = totalExecutions > 0 ? errorCount / totalExecutions : 0;

  return c.json({
    activeJobs,
    jobsProcessedLastHour,
    avgProcessingTimeMs,
    errorRate,
  }, HttpStatusCodes.OK);
};

/**
 * Update execution status
 */
export const updateExecutionStatus: AppRouteHandler<UpdateExecutionStatusRoute> = async (c) => {
  const { jobId, status, errorMessage, errorCode } = c.req.valid("json");

  // Find most recent execution for this job
  const recentExecution = await db.query.jobExecutions.findFirst({
    where: (fields, { eq }) => eq(fields.jobId, jobId),
    orderBy: (fields, { desc }) => desc(fields.createdAt),
  });

  if (!recentExecution) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  // Update execution status
  await db.update(jobExecutions)
    .set({
      status,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(jobExecutions.id, recentExecution.id));

  if (status === "FAILED" && errorMessage) {
    // Record error in jobErrors table
    await db.insert(jobErrors).values({
      id: crypto.randomUUID(),
      jobId,
      errorMessage,
      errorCode: errorCode || null,
      timestamp: new Date().toISOString(),
    });
  }

  return c.json({ success: true }, HttpStatusCodes.OK);
};

/**
 * Update job token usage counters
 */
export const updateJobTokenUsage: AppRouteHandler<UpdateJobTokenUsageRoute> = async (c) => {
  const { jobId, inputTokensDelta = 0, outputTokensDelta = 0, reasoningTokensDelta = 0, cachedInputTokensDelta = 0 } = c.req.valid("json");

  // Ensure job exists
  const job = await db.query.jobs.findFirst({ where: (f, { eq }) => eq(f.id, jobId) });
  if (!job) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  await db.update(jobs).set({
    inputTokens: (job.inputTokens || 0) + inputTokensDelta,
    outputTokens: (job.outputTokens || 0) + outputTokensDelta,
    reasoningTokens: (job.reasoningTokens || 0) + reasoningTokensDelta,
    cachedInputTokens: (job.cachedInputTokens || 0) + cachedInputTokensDelta,
    totalTokens: (job.totalTokens || 0) + inputTokensDelta + outputTokensDelta + reasoningTokensDelta,
    updatedAt: new Date().toISOString(),
  }).where(eq(jobs.id, jobId));

  return c.json({ success: true }, HttpStatusCodes.OK);
};
