/**
 * Database service interface and API-based implementation
 * Uses scheduler API routes instead of direct database access for better separation of concerns
 */

import type { EndpointExecutionResult, ExecutionResults, JobContext } from "../../types.js";
import type { AIAgentPlanResponse, AIAgentScheduleResponse } from "../ai-agent/index.js";

import apiClient from "../../api-client.js";

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
 * API-based database service implementation
 * Provides better separation of concerns and makes the scheduling engine portable
 */
export class ApiDatabaseService implements DatabaseService {
  /**
   * Create a new API-based database service
   * No config needed since we use API client
   */
  constructor() {
    // API client is globally available, no initialization needed
  }

  /**
   * Get jobs that are due for processing
   *
   * @param limit Maximum number of jobs to retrieve
   * @returns Array of job IDs that need processing
   */
  async getJobsToProcess(limit: number): Promise<string[]> {
    const response = await apiClient.api.scheduler["jobs-to-process"].$get({
      query: { limit: limit.toString() },
    });

    if (!response.ok) {
      throw new Error(`Failed to get jobs to process: ${response.status}`);
    }

    const data = await response.json();
    return data.jobIds;
  }

  /**
   * Lock a job for processing
   *
   * @param jobId Job ID to lock
   * @param expiresAt When the lock expires
   * @returns Whether the job was successfully locked
   */
  async lockJob(jobId: string, expiresAt: Date): Promise<boolean> {
    const response = await apiClient.api.scheduler.jobs.lock.$post({
      json: {
        jobId,
        expiresAt: expiresAt.toISOString(),
      },
    });

    if (!response.ok) {
      if (response.status === 409) {
        return false; // Job already locked
      }
      throw new Error(`Failed to lock job: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  }

  /**
   * Release a job lock
   *
   * @param jobId Job ID to unlock
   * @returns Whether the job was successfully unlocked
   */
  async unlockJob(jobId: string): Promise<boolean> {
    const response = await apiClient.api.scheduler.jobs.unlock.$post({
      json: { jobId },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return false; // Job not found
      }
      throw new Error(`Failed to unlock job: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  }

  /**
   * Get comprehensive job context
   *
   * @param jobId Job ID to get context for
   * @returns Complete job context or null if job not found
   */
  async getJobContext(jobId: string): Promise<JobContext | null> {
    const response = await apiClient.api.scheduler.jobs[":id"].context.$get({
      param: { id: jobId },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get job context: ${response.status}`);
    }

    const data = await response.json();

    // Convert API response types to match JobContext interface
    return {
      ...data,
      job: {
        ...data.job,
        nextRunAt: data.job.nextRunAt || undefined,
      },
      endpoints: data.endpoints.map(endpoint => ({
        ...endpoint,
        requestSchema: endpoint.requestSchema || undefined,
        timeoutMs: endpoint.timeoutMs || 30000,
        maxRequestSizeBytes: endpoint.maxRequestSizeBytes || undefined,
        maxResponseSizeBytes: endpoint.maxResponseSizeBytes || undefined,
      })),
      messages: data.messages.map(msg => ({
        id: msg.id,
        role: msg.role as "system" | "user" | "assistant" | "tool",
        content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        timestamp: msg.createdAt,
        source: msg.source || undefined,
      })),
      endpointUsage: data.endpointUsage.map(usage => ({
        ...usage,
        requestSizeBytes: usage.requestSizeBytes || undefined,
        responseSizeBytes: usage.responseSizeBytes || undefined,
        executionTimeMs: usage.executionTimeMs || 0,
        statusCode: usage.statusCode || undefined,
        truncated: usage.truncated || undefined,
        errorMessage: usage.errorMessage || undefined,
      })),
    };
  }

  /**
   * Record execution plan from AI agent
   *
   * @param jobId Job ID the plan is for
   * @param plan AI agent execution plan
   * @returns Whether the plan was successfully recorded
   */
  async recordExecutionPlan(jobId: string, plan: AIAgentPlanResponse): Promise<boolean> {
    const response = await apiClient.api.scheduler.jobs["execution-plan"].$post({
      json: { jobId, plan },
    });

    if (!response.ok) {
      throw new Error(`Failed to record execution plan: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  }

  /**
   * Record endpoint execution results
   *
   * @param jobId Job ID the results are for
   * @param results Endpoint execution results
   * @returns Whether the results were successfully recorded
   */
  async recordEndpointResults(jobId: string, results: EndpointExecutionResult[]): Promise<boolean> {
    if (results.length === 0) {
      return true;
    }

    const endpointResults = results.map(result => ({
      jobId,
      endpointId: result.endpointId,
      success: result.success ? 1 : 0,
      statusCode: result.statusCode || null,
      executionTimeMs: result.executionTimeMs || 0,
      responseContent: result.responseContent ? JSON.stringify(result.responseContent) : null,
      error: result.error || null,
      requestSizeBytes: result.requestSizeBytes || null,
      responseSizeBytes: result.responseSizeBytes || null,
      truncated: result.truncated ? 1 : 0,
    }));

    const response = await apiClient.api.scheduler.jobs["endpoint-results"].$post({
      json: endpointResults,
    });

    if (!response.ok) {
      throw new Error(`Failed to record endpoint results: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  }

  /**
   * Record execution summary
   *
   * @param jobId Job ID the summary is for
   * @param summary Execution summary
   * @returns Whether the summary was successfully recorded
   */
  async recordExecutionSummary(jobId: string, summary: ExecutionResults["summary"]): Promise<boolean> {
    const response = await apiClient.api.scheduler.jobs["execution-summary"].$post({
      json: { jobId, summary },
    });

    if (!response.ok) {
      throw new Error(`Failed to record execution summary: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  }

  /**
   * Update job schedule
   *
   * @param jobId Job ID to update
   * @param schedule Schedule response from AI agent
   * @returns Whether the schedule was successfully updated
   */
  async updateJobSchedule(jobId: string, schedule: AIAgentScheduleResponse): Promise<boolean> {
    const response = await apiClient.api.scheduler.jobs.schedule.$post({
      json: { jobId, schedule },
    });

    if (!response.ok) {
      throw new Error(`Failed to update job schedule: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  }

  /**
   * Record job error
   *
   * @param jobId Job ID the error is for
   * @param error Error message
   * @param errorCode Optional error code
   * @returns Whether the error was successfully recorded
   */
  async recordJobError(jobId: string, error: string, errorCode?: string): Promise<boolean> {
    const response = await apiClient.api.scheduler.jobs.error.$post({
      json: {
        jobId,
        error,
        errorCode,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to record job error: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  }

  /**
   * Get engine metrics
   *
   * @returns Engine metrics data
   */
  async getEngineMetrics(): Promise<{
    activeJobs: number;
    jobsProcessedLastHour: number;
    avgProcessingTimeMs: number;
    errorRate: number;
  }> {
    const response = await apiClient.api.scheduler.metrics.$get();

    if (!response.ok) {
      throw new Error(`Failed to get engine metrics: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }
}
