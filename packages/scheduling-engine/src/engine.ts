/**
 * Core scheduling engine implementation
 *
 * Simplified engine that uses API layer for all data operations
 */
import type { EngineConfig } from "./config";
import type {
  AIAgentService,
  DatabaseService,
  EndpointExecutorService,
} from "./services";
import type { EngineState, ExecutionResults, ProcessingResult } from "./types";

import {
  ApiDatabaseService,
  DefaultAIAgentService,
  DefaultEndpointExecutorService,
} from "./services";

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
      endTime: new Date(), // Will be updated at the end
      jobsProcessed: 0,
      successfulJobs: 0,
      failedJobs: 0,
      errors: [],
    };

    try {
      // Get jobs that need processing
      const maxBatchSize = this.config.scheduler?.maxBatchSize ?? 20;
      const jobIds = await this.database.getJobsToProcess(maxBatchSize);

      result.jobsProcessed = jobIds.length;

      // Process each job
      for (const jobId of jobIds) {
        try {
          // Lock the job
          const locked = await this.database.lockJob(
            jobId,
            new Date(Date.now() + (this.config.scheduler?.staleLockThresholdMs ?? 300000)),
          );

          if (!locked) {
            // Skip if lock not acquired
            continue;
          }

          // Get job context
          const jobContext = await this.database.getJobContext(jobId);

          if (!jobContext) {
            await this.database.unlockJob(jobId);
            continue;
          }

          // Add execution time for context
          const contextWithTime = {
            ...jobContext,
            executionContext: {
              ...jobContext.executionContext,
              currentTime: new Date().toISOString(),
              systemEnvironment: (jobContext.executionContext?.systemEnvironment || "production") as "production" | "development" | "test",
            },
          };

          // Plan phase - Ask AI agent for execution plan
          this.state.stats.aiAgentCalls++;
          const executionPlan = await this.aiAgent.planExecution(contextWithTime);

          // Record the plan
          await this.database.recordExecutionPlan(jobId, executionPlan);

          // Execute endpoints according to plan
          const endpointResults = await this.executor.executeEndpoints(contextWithTime, executionPlan);

          // Record individual endpoint results
          await this.database.recordEndpointResults(jobId, endpointResults);

          // Create execution summary
          const executionSummary: ExecutionResults = {
            results: endpointResults,
            summary: {
              startTime: new Date().toISOString(),
              endTime: new Date().toISOString(),
              totalDurationMs: endpointResults.reduce((total, r) => total + r.executionTimeMs, 0),
              successCount: endpointResults.filter(r => r.success).length,
              failureCount: endpointResults.filter(r => !r.success).length,
            },
          };

          // Record execution summary
          await this.database.recordExecutionSummary(jobId, executionSummary.summary);

          // Update endpoint call stats
          this.state.stats.totalEndpointCalls += endpointResults.length;

          // Schedule phase - Get next run time from AI agent
          this.state.stats.aiAgentCalls++;
          const scheduleResponse = await this.aiAgent.finalizeSchedule(contextWithTime, executionSummary);

          // Update job schedule
          await this.database.updateJobSchedule(jobId, scheduleResponse);

          // Release the lock
          await this.database.unlockJob(jobId);

          // Update success count
          result.successfulJobs++;
        }
        catch (jobError) {
          result.failedJobs++;
          const errorMessage = jobError instanceof Error ? jobError.message : String(jobError);
          result.errors.push({
            message: errorMessage,
            jobId,
          });

          // Record error and unlock job
          await this.database.recordJobError(jobId, errorMessage);
          await this.database.unlockJob(jobId);
        }
      }

      // Log completion
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

    // Update engine stats
    this.state.stats.totalJobsProcessed += result.jobsProcessed;
    this.state.stats.successfulJobs += result.successfulJobs;
    this.state.stats.failedJobs += result.failedJobs;

    return result;
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
