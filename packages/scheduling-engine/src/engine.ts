/**
 * Core scheduling engine implementation
 *
 * Simplified engine that uses API layer for all data operations
 */
import type { EngineConfig } from "./config.js";
import type {
  AIAgentService,
  DatabaseService,
  EndpointExecutorService,
} from "./services/index.js";
import type { EngineState, ExecutionResults, ProcessingResult } from "./types.js";

import {
  ApiDatabaseService,
  DefaultAIAgentService,
  DefaultEndpointExecutorService,
} from "./services/index.js";

/**
 * Main scheduling engine class
 *
 * Responsible for job discovery, execution, and scheduling
 */
export class SchedulingEngine {
  private config: EngineConfig;
  private state: EngineState = {
    status: "stopped",
    lastProcessingTime: null,
    stats: {
      totalJobsProcessed: 0,
      successfulJobs: 0,
      failedJobs: 0,
      totalEndpointCalls: 0,
      aiAgentCalls: 0,
      totalCyclesProcessed: 0,
      totalProcessingTimeMs: 0,
      lastCycleDurationMs: 0,
      avgCycleDurationMs: 0,
    },
  };

  // Service instances
  private aiAgent: AIAgentService;
  private executor: EndpointExecutorService;
  private database: DatabaseService;

  private processingInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Create a new scheduling engine instance
   *
   * @param config Engine configuration
   */
  constructor(config: EngineConfig) {
    this.config = this.applyDefaultConfig(config);

    // Initialize services - no database config needed for API-based service
    this.aiAgent = new DefaultAIAgentService(this.config.aiAgent);
    this.executor = new DefaultEndpointExecutorService(this.config.execution);
    this.database = new ApiDatabaseService();
  }

  /**
   * Start the scheduling engine
   *
   * @returns Promise that resolves when the engine has started
   */
  async start(): Promise<void> {
    if (this.state.status === "running") {
      throw new Error("Engine is already running");
    }

    // TODO: Initialize components

    this.state.status = "running";
    this.state.startTime = new Date();

    const interval = this.config.scheduler?.processingIntervalMs ?? 60000; // Default: 1 minute

    this.processingInterval = setInterval(async () => {
      try {
        await this.processCycle();
      }
      catch (error) {
        console.error("Error processing job cycle:", error);
        // TODO: Proper error handling and logging
      }
    }, interval);

    console.warn(`Scheduling engine started with ${interval}ms interval`);
  }

  /**
   * Stop the scheduling engine
   *
   * @returns Promise that resolves when the engine has stopped
   */
  async stop(): Promise<void> {
    if (this.state.status !== "running") {
      return;
    }

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.state.status = "stopped";
    this.state.stopTime = new Date();

    console.warn("Scheduling engine stopped");
  }

  /**
   * Process a single cycle of jobs
   *
   * @returns Processing results
   */
  async processCycle(): Promise<ProcessingResult> {
    const startTime = new Date();
    this.state.lastProcessingTime = startTime;

    const result: ProcessingResult = {
      startTime,
      endTime: new Date(), // updated later
      jobsProcessed: 0,
      successfulJobs: 0,
      failedJobs: 0,
      errors: [],
    };

    try {
      const maxBatchSize = this.config.scheduler?.maxBatchSize ?? 20;
      const jobIds = await this.database.getJobsToProcess(maxBatchSize);
      result.jobsProcessed = jobIds.length;
      if (jobIds.length === 0) {
        const logger = this.config.logger || console;
        logger.info("Processing cycle completed: 0/0 jobs successful");
        result.endTime = new Date();
        result.duration = result.endTime.getTime() - result.startTime.getTime();
        return result;
      }

      const concurrency = Math.max(1, this.config.scheduler?.jobProcessingConcurrency ?? 1);

      // Simple worker pool
      let index = 0;
      const processNext = async (): Promise<void> => {
        const current = index++;
        if (current >= jobIds.length)
          return;
        const jobId = jobIds[current];
        await this.processSingleJob(jobId, result).catch(() => { /* errors recorded inside */ });
        return processNext();
      };

      const workers = Array.from({ length: Math.min(concurrency, jobIds.length) }, () => processNext());
      await Promise.all(workers);

      const logger = this.config.logger || console;
      logger.info(`Processing cycle completed: ${result.successfulJobs}/${result.jobsProcessed} jobs successful`);
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const logger = this.config.logger || console;
      logger.error("Error in processing cycle:", errorMessage);
      result.errors.push({ message: errorMessage });
    }

    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();

    this.state.stats.totalJobsProcessed += result.jobsProcessed;
    this.state.stats.successfulJobs += result.successfulJobs;
    this.state.stats.failedJobs += result.failedJobs;

    // performance metrics
    this.state.stats.totalCyclesProcessed = (this.state.stats.totalCyclesProcessed || 0) + 1;
    this.state.stats.totalProcessingTimeMs = (this.state.stats.totalProcessingTimeMs || 0) + (result.duration || 0);
    this.state.stats.lastCycleDurationMs = result.duration;
    this.state.stats.avgCycleDurationMs = Math.round(
      (this.state.stats.totalProcessingTimeMs || 0) / (this.state.stats.totalCyclesProcessed || 1),
    );

    return result;
  }

  private async processSingleJob(jobId: string, aggregate: ProcessingResult): Promise<void> {
    try {
      const locked = await this.database.lockJob(jobId, new Date(Date.now() + (this.config.scheduler?.staleLockThresholdMs ?? 300000)));
      if (!locked)
        return; // skip silently

      // mark execution RUNNING (best effort)
      try {
        await this.database.updateExecutionStatus?.(jobId, "RUNNING");
      }
      catch {
        /* optional */
      }

      const jobContext = await this.database.getJobContext(jobId);
      if (!jobContext) {
        await this.database.unlockJob(jobId);
        return;
      }

      const contextWithTime = {
        ...jobContext,
        executionContext: {
          ...jobContext.executionContext,
          currentTime: new Date().toISOString(),
          systemEnvironment: (jobContext.executionContext?.systemEnvironment || "production") as "production" | "development" | "test",
        },
      };

      this.state.stats.aiAgentCalls++;
      const executionPlan = await this.aiAgent.planExecution(contextWithTime);
      // accumulate & persist token usage
      if (executionPlan.usage && this.config.metrics?.trackTokenUsage) {
        const { inputTokens = 0, outputTokens = 0, totalTokens = 0, reasoningTokens, cachedInputTokens } = executionPlan.usage;
        this.state.stats.aiInputTokens = (this.state.stats.aiInputTokens || 0) + inputTokens;
        this.state.stats.aiOutputTokens = (this.state.stats.aiOutputTokens || 0) + outputTokens;
        this.state.stats.aiTotalTokens = (this.state.stats.aiTotalTokens || 0) + totalTokens;
        try {
          await this.database.updateJobTokenUsage?.({
            jobId,
            inputTokensDelta: inputTokens,
            outputTokensDelta: outputTokens,
            reasoningTokensDelta: reasoningTokens,
            cachedInputTokensDelta: cachedInputTokens,
          });
        }
        catch { /* optional */ }
      }
      await this.database.recordExecutionPlan(jobId, executionPlan);

      const endpointResults = await this.executor.executeEndpoints(contextWithTime, executionPlan);
      await this.database.recordEndpointResults(jobId, endpointResults);

      const executionSummary: ExecutionResults = {
        results: endpointResults,
        summary: {
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          totalDurationMs: endpointResults.reduce((t, r) => t + r.executionTimeMs, 0),
          successCount: endpointResults.filter(r => r.success).length,
          failureCount: endpointResults.filter(r => !r.success).length,
        },
      };
      await this.database.recordExecutionSummary(jobId, executionSummary.summary);
      this.state.stats.totalEndpointCalls += endpointResults.length;

      this.state.stats.aiAgentCalls++;
      const scheduleResponse = await this.aiAgent.finalizeSchedule(contextWithTime, executionSummary);
      if (scheduleResponse.usage && this.config.metrics?.trackTokenUsage) {
        const { inputTokens = 0, outputTokens = 0, totalTokens = 0, reasoningTokens, cachedInputTokens } = scheduleResponse.usage;
        this.state.stats.aiInputTokens = (this.state.stats.aiInputTokens || 0) + inputTokens;
        this.state.stats.aiOutputTokens = (this.state.stats.aiOutputTokens || 0) + outputTokens;
        this.state.stats.aiTotalTokens = (this.state.stats.aiTotalTokens || 0) + totalTokens;
        try {
          await this.database.updateJobTokenUsage?.({
            jobId,
            inputTokensDelta: inputTokens,
            outputTokensDelta: outputTokens,
            reasoningTokensDelta: reasoningTokens,
            cachedInputTokensDelta: cachedInputTokens,
          });
        }
        catch { /* optional */ }
      }
      await this.database.updateJobSchedule(jobId, scheduleResponse);

      await this.database.unlockJob(jobId);
      aggregate.successfulJobs++;
    }
    catch (jobError) {
      aggregate.failedJobs++;
      const errorMessage = jobError instanceof Error ? jobError.message : String(jobError);
      aggregate.errors.push({ message: errorMessage, jobId });
      try {
        await this.database.recordJobError(jobId, errorMessage);
        try {
          await this.database.updateExecutionStatus?.(jobId, "FAILED", errorMessage);
        }
        catch {
          /* optional */
        }
        await this.database.unlockJob(jobId);
      }
      catch { /* swallow */ }
    }
  }

  /**
   * Get current engine state
   *
   * @returns Current state of the engine
   */
  getState(): EngineState {
    return { ...this.state };
  }

  /**
   * Apply default configuration values
   *
   * @param config User-provided configuration
   * @returns Configuration with defaults applied
   */
  private applyDefaultConfig(config: EngineConfig): EngineConfig {
    // Create default config
    const defaultConfig: Partial<EngineConfig> = {
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
        processingIntervalMs: 60000, // 1 minute
        autoUnlockStaleJobs: true,
        staleLockThresholdMs: 300000, // 5 minutes
      },
    };

    // Merge with user config
    return {
      ...config,
      aiAgent: {
        ...defaultConfig.aiAgent,
        ...config.aiAgent,
      },
      execution: {
        ...defaultConfig.execution,
        ...config.execution,
      },
      metrics: {
        ...defaultConfig.metrics,
        ...config.metrics,
      },
      scheduler: {
        ...defaultConfig.scheduler,
        ...config.scheduler,
      },
    };
  }
}
