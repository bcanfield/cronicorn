/**
 * Database service interface and implementations
 */
import type { DatabaseConfig } from "../../config";
import type { EndpointExecutionResult, ExecutionResults, JobContext } from "../../types";
import type { AIAgentPlanResponse, AIAgentScheduleResponse } from "../ai-agent";

/**
 * Interface for database operations
 */
export type DatabaseService = {
  /**
   * Get jobs that need processing
   *
   * @param limit Maximum number of jobs to retrieve
   * @returns Array of job IDs
   */
  getJobsToProcess: (limit: number) => Promise<string[]>;

  /**
   * Lock a job for processing
   *
   * @param jobId Job ID to lock
   * @param expiresAt When the lock expires
   * @returns Whether the job was successfully locked
   */
  lockJob: (jobId: string, expiresAt: Date) => Promise<boolean>;

  /**
   * Release a job lock
   *
   * @param jobId Job ID to unlock
   * @returns Whether the job was successfully unlocked
   */
  unlockJob: (jobId: string) => Promise<boolean>;

  /**
   * Get job context
   *
   * @param jobId Job ID to get context for
   * @returns Job context or null if not found
   */
  getJobContext: (jobId: string) => Promise<JobContext | null>;

  /**
   * Record execution plan from AI agent
   *
   * @param jobId Job ID the plan is for
   * @param plan AI agent execution plan
   * @returns Whether the plan was successfully recorded
   */
  recordExecutionPlan: (jobId: string, plan: AIAgentPlanResponse) => Promise<boolean>;

  /**
   * Record endpoint execution results
   *
   * @param jobId Job ID the results are for
   * @param results Endpoint execution results
   * @returns Whether the results were successfully recorded
   */
  recordEndpointResults: (jobId: string, results: EndpointExecutionResult[]) => Promise<boolean>;

  /**
   * Record execution summary
   *
   * @param jobId Job ID the summary is for
   * @param summary Execution summary
   * @returns Whether the summary was successfully recorded
   */
  recordExecutionSummary: (jobId: string, summary: ExecutionResults["summary"]) => Promise<boolean>;

  /**
   * Update job schedule
   *
   * @param jobId Job ID to update
   * @param schedule Schedule response from AI agent
   * @returns Whether the schedule was successfully updated
   */
  updateJobSchedule: (jobId: string, schedule: AIAgentScheduleResponse) => Promise<boolean>;

  /**
   * Record job error
   *
   * @param jobId Job ID the error is for
   * @param error Error message
   * @param errorCode Optional error code
   * @returns Whether the error was successfully recorded
   */
  recordJobError: (jobId: string, error: string, errorCode?: string) => Promise<boolean>;

  /**
   * Get engine metrics
   *
   * @returns Engine metrics data
   */
  getEngineMetrics: () => Promise<{
    activeJobs: number;
    jobsProcessedLastHour: number;
    avgProcessingTimeMs: number;
    errorRate: number;
  }>;
};

/**
 * Database service implementation using Drizzle ORM
 */
export class DrizzleDatabaseService implements DatabaseService {
  /**
   * Private database client instance
   */
  private db: any;

  /**
   * Create a new database service
   *
   * @param config Database configuration
   */
  constructor(config: DatabaseConfig) {
    // In a real implementation, we would create a Drizzle client
    // For now, we'll stub this and assume it's injected for testing
    this.db = config.client;
  }

  /**
   * Get jobs that are due for processing
   *
   * @param limit Maximum number of jobs to retrieve
   * @returns Array of job IDs that need processing
   */
  async getJobsToProcess(limit: number): Promise<string[]> {
    try {
      // Get the current time
      const now = new Date();

      // Query for jobs that:
      // 1. Are active
      // 2. Are not locked
      // 3. Have a nextRunAt time in the past or equal to now
      // 4. Order by nextRunAt (oldest first)
      // 5. Limit to the specified number
      const jobs = await this.db.query.jobs.findMany({
        where: {
          status: "ACTIVE",
          locked: false,
          nextRunAt: { lte: now.toISOString() },
        },
        orderBy: [{ nextRunAt: "asc" }],
        limit,
      });

      // Extract and return just the job IDs
      return jobs.map(job => job.id);
    }
    catch (error) {
      // Propagate database errors
      throw error;
    }
  }

  /**
   * Locks a job for processing
   *
   * @param jobId Job ID to lock
   * @param expiresAt When the lock expires
   * @returns Whether the job was successfully locked
   */
  async lockJob(jobId: string, expiresAt: Date): Promise<boolean> {
    // Update the job with locked flag and lock expiration
    const result = await this.db.query.jobs.update({
      where: {
        id: jobId,
        locked: false, // Only lock if not already locked (optimistic locking)
      },
      set: {
        locked: true,
        lockExpiresAt: expiresAt.toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    // If no rows were updated, job was not found or already locked
    return result.length > 0;
  }

  /**
   * Release a job lock
   *
   * @param jobId Job ID to unlock
   * @returns Whether the job was successfully unlocked
   */
  async unlockJob(jobId: string): Promise<boolean> {
    // Update the job to remove the lock
    const result = await this.db.query.jobs.update({
      where: {
        id: jobId,
      },
      set: {
        locked: false,
        lockExpiresAt: null,
        updatedAt: new Date().toISOString(),
      },
    });

    // If no rows were updated, job was not found
    return result.length > 0;
  }

  /**
   * Get comprehensive job context
   *
   * @param jobId Job ID to get context for
   * @returns Complete job context or null if job not found
   */
  async getJobContext(jobId: string): Promise<JobContext | null> {
    // Get the job data
    const job = await this.db.query.jobs.findFirst({
      where: { id: jobId },
    });

    // If job not found, return null
    if (!job) {
      return null;
    }

    // Get associated endpoints
    const endpoints = await this.db.query.endpoints.findMany({
      where: { jobId },
      orderBy: [{ createdAt: "asc" }],
    });

    // Get recent messages
    const messages = await this.db.query.messages.findMany({
      where: { jobId },
      orderBy: [{ timestamp: "desc" }],
      limit: 50, // Limit to recent messages
    });

    // Get endpoint usage history
    const endpointUsage = await this.db.query.endpointUsage.findMany({
      where: {
        endpointId: { in: endpoints.map(e => e.id as string) },
      },
      orderBy: [{ timestamp: "desc" }],
      limit: 100, // Limit to recent usage
    });

    // Build and return job context
    return {
      job,
      endpoints,
      messages,
      endpointUsage,
      executionContext: {
        currentTime: new Date().toISOString(),
        systemEnvironment: "test", // This would be configured in production
      },
    };
  }

  async recordExecutionPlan(jobId: string, plan: AIAgentPlanResponse): Promise<boolean> {
    // Insert the execution plan into the jobExecutions table
    await this.db.query.jobExecutions.insert({
      jobId,
      executionPlan: JSON.stringify(plan), // Store plan as JSON string
      planConfidence: plan.confidence,
      planReasoning: plan.reasoning,
      executionStrategy: plan.executionStrategy,
      createdAt: new Date().toISOString(),
    });

    return true;
    // Note: Database errors will propagate naturally without try/catch
  }

  async recordEndpointResults(jobId: string, results: EndpointExecutionResult[]): Promise<boolean> {
    // Map results to the database schema format
    const recordsToInsert = results.map(result => ({
      jobId,
      endpointId: result.endpointId,
      success: result.success ? 1 : 0, // Convert boolean to number for DB
      statusCode: result.statusCode,
      responseContent: result.responseContent ? JSON.stringify(result.responseContent) : null,
      error: result.error || null,
      executionTimeMs: result.executionTimeMs,
      timestamp: result.timestamp,
      requestSizeBytes: result.requestSizeBytes || null,
      responseSizeBytes: result.responseSizeBytes || null,
      truncated: result.truncated ? 1 : 0, // Convert boolean to number for DB
    }));

    // Batch insert all results
    await this.db.query.endpointResults.insert(recordsToInsert);

    // Also update endpointUsage for historical tracking
    // This duplicates some data but is useful for analytics
    await this.db.query.endpointUsage.insert(
      results.map(result => ({
        endpointId: result.endpointId,
        timestamp: result.timestamp,
        executionTimeMs: result.executionTimeMs,
        statusCode: result.statusCode || null,
        success: result.success ? 1 : 0, // Convert boolean to number for DB
        errorMessage: result.error || null,
        requestSizeBytes: result.requestSizeBytes || null,
        responseSizeBytes: result.responseSizeBytes || null,
        truncated: result.truncated ? 1 : 0, // Convert boolean to number for DB
      })),
    );

    return true;
  }

  async recordExecutionSummary(jobId: string, summary: ExecutionResults["summary"]): Promise<boolean> {
    // Try to update the most recent job execution record
    const updated = await this.db.query.jobExecutions.update({
      where: {
        jobId,
        // Try to find the most recent execution for this job
      },
      set: {
        executionSummary: JSON.stringify(summary),
        startTime: summary.startTime,
        endTime: summary.endTime,
        durationMs: summary.totalDurationMs,
        successCount: summary.successCount,
        failureCount: summary.failureCount,
        updatedAt: new Date().toISOString(),
      },
    });

    // If no records were updated, create a new execution record
    if (!updated || updated.length === 0) {
      await this.db.query.jobExecutions.insert({
        jobId,
        executionSummary: JSON.stringify(summary),
        startTime: summary.startTime,
        endTime: summary.endTime,
        durationMs: summary.totalDurationMs,
        successCount: summary.successCount,
        failureCount: summary.failureCount,
        createdAt: new Date().toISOString(),
      });
    }

    return true;
  }

  async updateJobSchedule(jobId: string, schedule: AIAgentScheduleResponse): Promise<boolean> {
    // Update the job with the new next run time
    await this.db.query.jobs.update({
      where: { id: jobId },
      set: {
        nextRunAt: schedule.nextRunAt,
        updatedAt: new Date().toISOString(),
      },
    });

    // If there are recommended actions, record them as system messages
    if (schedule.recommendedActions && schedule.recommendedActions.length > 0) {
      // Format recommendations as a message
      const content = `Recommended actions from schedule analysis:
${schedule.recommendedActions.map((action) => {
        return `- [${action.priority.toUpperCase()}] ${action.type}: ${action.details}`;
      }).join("\n")}

Reasoning: ${schedule.reasoning}
Confidence: ${(schedule.confidence * 100).toFixed(0)}%`;

      // Store as a system message
      await this.db.query.messages.insert({
        jobId,
        role: "system",
        content,
        timestamp: new Date().toISOString(),
      });
    }

    return true;
  }

  async recordJobError(jobId: string, error: string, errorCode?: string): Promise<boolean> {
    // Record the error in the job_errors table
    await this.db.query.jobErrors.insert({
      jobId,
      errorMessage: error,
      errorCode: errorCode || null,
      timestamp: new Date().toISOString(),
    });

    // Also record as a system message for visibility in job context
    await this.db.query.messages.insert({
      jobId,
      role: "system",
      content: `ERROR${errorCode ? ` [${errorCode}]` : ""}: ${error}`,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  async getEngineMetrics(): Promise<{
    activeJobs: number;
    jobsProcessedLastHour: number;
    avgProcessingTimeMs: number;
    errorRate: number;
  }> {
    // Get the timestamp for one hour ago
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const oneHourAgoISO = oneHourAgo.toISOString();

    // Count active jobs
    const activeJobs = await this.db.query.jobs.count({
      where: { status: "ACTIVE" },
    });

    // Count jobs processed in the last hour
    const jobsProcessedLastHour = await this.db.query.jobExecutions.count({
      where: {
        createdAt: { gte: oneHourAgoISO },
      },
    });

    // Get average processing time
    const recentExecutions = await this.db.query.jobExecutions.findMany({
      where: {
        // Get executions with duration data from last day
        durationMs: { notNull: true },
        createdAt: { gte: new Date(Date.now() - 86400000).toISOString() },
      },
      orderBy: [{ createdAt: "desc" }],
      limit: 100, // Limit to recent executions for performance
    });

    // Calculate average processing time
    let avgProcessingTimeMs = 0;
    if (recentExecutions.length > 0) {
      const totalDuration = recentExecutions.reduce(
        (sum: number, exec: { durationMs?: number }) => sum + (exec.durationMs || 0),
        0,
      );
      avgProcessingTimeMs = Math.round(totalDuration / recentExecutions.length);
    }

    // Count errors in the last hour
    const errorCount = await this.db.query.jobErrors.count({
      where: {
        timestamp: { gte: oneHourAgoISO },
      },
    });

    // Count total executions in the same period for error rate
    const totalExecutions = await this.db.query.jobExecutions.count({
      where: {
        createdAt: { gte: oneHourAgoISO },
      },
    });

    // Calculate error rate (avoid division by zero)
    const errorRate = totalExecutions > 0 ? errorCount / totalExecutions : 0;

    return {
      activeJobs,
      jobsProcessedLastHour,
      avgProcessingTimeMs,
      errorRate,
    };
  }
}
