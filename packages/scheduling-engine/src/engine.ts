import { randomUUID } from "node:crypto";

import type { EngineConfig, EventsConfig } from "./config.js";
import type { AIAgentMetricsEvent, AIAgentPlanResponse, AIAgentScheduleResponse } from "./services/ai-agent/types.js";
import type { AIAgentService, DatabaseService, EndpointExecutorService } from "./services/index.js";
import type { EngineState, ExecutionResults, JobContext, ProcessingResult } from "./types.js";

import { classifyPlanError, classifyScheduleError } from "./services/ai-agent/classification.js";
import { ApiDatabaseService, DefaultAIAgentService, DefaultEndpointExecutorService } from "./services/index.js";

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
  // private events?: EventsConfig; // removed unused

  private processingInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Create a new scheduling engine instance
   *
   * @param config Engine configuration
   */
  private log: { info?: (...a: unknown[]) => void; error?: (...a: unknown[]) => void } = {};
  constructor(config: EngineConfig, deps?: { aiAgent?: AIAgentService; executor?: EndpointExecutorService; database?: DatabaseService }) {
    this.config = config;

    // Safe logger extraction (no assertions / any)
    const rawLogger = config.logger;
    if (rawLogger && typeof rawLogger === "object") {
      if (typeof rawLogger.info === "function") {
        this.log.info = (msg: unknown, meta?: unknown) => {
          try {
            rawLogger.info?.(msg, meta);
          }
          catch {
            /* swallow */
          }
        };
      }
      if (typeof rawLogger.error === "function") {
        this.log.error = (msg: unknown, meta?: unknown) => {
          try {
            rawLogger.error?.(msg, meta);
          }
          catch {
            /* swallow */
          }
        };
      }
    }

    const metricsHook = (evt: AIAgentMetricsEvent) => {
      switch (evt.type) {
        case "malformed": {
          if (evt.phase === "plan") {
            this.state.stats.malformedResponsesPlan = (this.state.stats.malformedResponsesPlan ?? 0) + 1;
          }
          else {
            this.state.stats.malformedResponsesSchedule = (this.state.stats.malformedResponsesSchedule ?? 0) + 1;
          }
          break;
        }
        case "repairAttempt": {
          if (evt.phase === "plan") {
            this.state.stats.repairAttemptsPlan = (this.state.stats.repairAttemptsPlan ?? 0) + 1;
          }
          else {
            this.state.stats.repairAttemptsSchedule = (this.state.stats.repairAttemptsSchedule ?? 0) + 1;
          }
          break;
        }
        case "repairSuccess": {
          if (evt.phase === "plan") {
            this.state.stats.repairSuccessesPlan = (this.state.stats.repairSuccessesPlan ?? 0) + 1;
          }
          else {
            this.state.stats.repairSuccessesSchedule = (this.state.stats.repairSuccessesSchedule ?? 0) + 1;
          }
          break;
        }
        case "repairFailure": {
          if (evt.phase === "plan") {
            this.state.stats.repairFailuresPlan = (this.state.stats.repairFailuresPlan ?? 0) + 1;
          }
          else {
            this.state.stats.repairFailuresSchedule = (this.state.stats.repairFailuresSchedule ?? 0) + 1;
          }
          break;
        }
      }
    };
    // Preserve any user-supplied hook by chaining after internal metrics update
    const userHook = this.config.aiAgent.metricsHook;
    this.config.aiAgent.metricsHook = (evt: AIAgentMetricsEvent) => {
      metricsHook(evt);
      userHook?.(evt);
      // persistence hook trigger for malformed / repair success or failure (metadata capture)
      const persist = this.config.aiAgent.malformedPersistenceHook;
      if (persist) {
        if (evt.type === "malformed") {
          const attempts = evt.phase === "plan" ? (this.state.stats.repairAttemptsPlan ?? 0) : (this.state.stats.repairAttemptsSchedule ?? 0);
          persist({ phase: evt.phase, jobId: "unknown", category: evt.category, attempts, repaired: false });
        }
        else if (evt.type === "repairSuccess") {
          const attempts = evt.phase === "plan" ? (this.state.stats.repairAttemptsPlan ?? 0) : (this.state.stats.repairAttemptsSchedule ?? 0);
          persist({ phase: evt.phase, jobId: "unknown", category: "schema_parse_error", attempts, repaired: true });
        }
      }
    };
    this.aiAgent = deps?.aiAgent || new DefaultAIAgentService(this.config.aiAgent);
    // wrap events to enrich progress tracking
    const userEvents = this.config.events;
    const wrappedEvents: EventsConfig | undefined = userEvents ? { ...userEvents } : {};
    if (wrappedEvents) {
      const originalEndpointProgress = wrappedEvents.onEndpointProgress;
      wrappedEvents.onEndpointProgress = (e) => {
        const prog = this.state.progress;
        if (prog && this.state.progress) {
          const totalJobs = this.state.progress.total;
          const completedJobs = this.state.progress.completed;
          userEvents?.onExecutionProgress?.({ jobId: e.jobId, total: totalJobs, completed: completedJobs });
        }
        originalEndpointProgress?.(e);
      };
    }
    this.executor = deps?.executor || new DefaultEndpointExecutorService(this.config.execution, wrappedEvents, this.config.logger);
    this.database = deps?.database || new ApiDatabaseService();
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
    const cycleId = randomUUID();
    const startTime = new Date();
    this.log.info?.("cycle_start", { cycleId, startTime: startTime.toISOString() });
    this.state.lastProcessingTime = startTime;
    // progress scaffold
    const abortController = new AbortController();
    this.state.abortController = {
      signal: abortController.signal,
      abort: () => {
        abortController.abort();
      },
    };
    this.state.progress = { total: 0, completed: 0, startedAt: startTime.toISOString(), updatedAt: startTime.toISOString(), endpoints: { total: 0, completed: 0 } };
    const events = this.config.events || {};
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
      this.log.info?.("cycle_jobs_fetched", { cycleId, count: jobIds.length });
      result.jobsProcessed = jobIds.length;
      this.state.progress.total = jobIds.length;
      this.state.progress.endpoints = { total: 0, completed: 0 };
      events.onExecutionProgress?.({ total: this.state.progress.total, completed: this.state.progress.completed });
      if (jobIds.length === 0) {
        this.log.info?.("Processing cycle completed: 0/0 jobs successful");
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
        this.log.info?.("job_start", { cycleId, jobId });
        await this.processSingleJob(jobId, result).catch(() => { /* errors recorded inside */ });
        this.log.info?.("job_end", { cycleId, jobId });
        // job-level progress
        this.state.progress!.completed++;
        // endpoint-level aggregate progress (increment after each job by its endpoint count)
        if (this.state.progress!.endpoints) {
          this.state.progress!.endpoints.total += 0; // placeholder (could accumulate planned endpoints)
          this.state.progress!.endpoints.completed += 0; // placeholder until deeper integration
        }
        this.state.progress!.updatedAt = new Date().toISOString();
        events.onExecutionProgress?.({ total: this.state.progress!.total, completed: this.state.progress!.completed });
        return processNext();
      };

      const workers = Array.from({ length: Math.min(concurrency, jobIds.length) }, () => processNext());
      await Promise.all(workers);

      this.log.info?.(`Processing cycle completed: ${result.successfulJobs}/${result.jobsProcessed} jobs successful`);
      this.log.info?.("cycle_summary", { cycleId, jobsProcessed: result.jobsProcessed, successful: result.successfulJobs, failed: result.failedJobs });
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.error?.("cycle_error", { cycleId, error: errorMessage });
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

    this.log.info?.("cycle_metrics", { cycleId, durationMs: result.duration, avgCycleDurationMs: this.state.stats.avgCycleDurationMs });

    this.state.progress = undefined;
    this.state.abortController = undefined;
    events.onExecutionProgress?.({ total: result.jobsProcessed, completed: result.successfulJobs + result.failedJobs });
    return result;
  }

  private async runPlanWithWrapper(jobContext: JobContext): Promise<AIAgentPlanResponse> {
    try {
      return await this.aiAgent.planExecution(jobContext);
    }
    catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const alreadyClassified = /Error in planExecution \[/.test(msg);
      const repairable = /Semantic validation failed|Error parsing|schema/i.test(msg) && !alreadyClassified;
      if (repairable && this.config.aiAgent.repairMalformedResponses) {
        this.state.stats.repairAttemptsPlan = (this.state.stats.repairAttemptsPlan ?? 0) + 1;
        try {
          const repaired = await this.aiAgent.planExecution(jobContext);
          this.state.stats.repairSuccessesPlan = (this.state.stats.repairSuccessesPlan ?? 0) + 1;
          return repaired;
        }
        catch (err2) {
          this.state.stats.repairFailuresPlan = (this.state.stats.repairFailuresPlan ?? 0) + 1;
          this.state.stats.malformedResponsesPlan = (this.state.stats.malformedResponsesPlan ?? 0) + 1;
          throw err2;
        }
      }
      classifyPlanError(msg); // classification side-effect for future differentiation (value unused)
      this.state.stats.malformedResponsesPlan = (this.state.stats.malformedResponsesPlan ?? 0) + 1;
      throw err;
    }
  }

  private async runScheduleWithWrapper(jobContext: JobContext, executionResults: ExecutionResults): Promise<AIAgentScheduleResponse> {
    try {
      return await this.aiAgent.finalizeSchedule(jobContext, executionResults);
    }
    catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const alreadyClassified = /Error in finalizeSchedule \[/.test(msg);
      const repairable = /Semantic validation failed|Error parsing|schema/i.test(msg) && !alreadyClassified;
      if (repairable && this.config.aiAgent.repairMalformedResponses) {
        this.state.stats.repairAttemptsSchedule = (this.state.stats.repairAttemptsSchedule ?? 0) + 1;
        try {
          const repaired = await this.aiAgent.finalizeSchedule(jobContext, executionResults);
          this.state.stats.repairSuccessesSchedule = (this.state.stats.repairSuccessesSchedule ?? 0) + 1;
          return repaired;
        }
        catch (err2) {
          this.state.stats.repairFailuresSchedule = (this.state.stats.repairFailuresSchedule ?? 0) + 1;
          this.state.stats.malformedResponsesSchedule = (this.state.stats.malformedResponsesSchedule ?? 0) + 1;
          throw err2;
        }
      }
      classifyScheduleError(msg);
      this.state.stats.malformedResponsesSchedule = (this.state.stats.malformedResponsesSchedule ?? 0) + 1;
      throw err;
    }
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
          systemEnvironment: (() => {
            const env = jobContext.executionContext?.systemEnvironment;
            return env === "production" || env === "development" || env === "test" ? env : "production";
          })(),
          abortSignal: this.config.execution.allowCancellation ? this.state.abortController?.signal : undefined,
        },
      };

      this.state.stats.aiAgentCalls++;
      const executionPlan = await this.runPlanWithWrapper(contextWithTime);
      // initialize endpoint progress entries
      if (this.state.progress?.endpoints) {
        this.state.progress.endpoints.total += executionPlan.endpointsToCall.length;
        if (!this.state.progress.endpoints.byId)
          this.state.progress.endpoints.byId = {};
        const nowIso = new Date().toISOString();
        for (const ep of executionPlan.endpointsToCall) {
          if (!this.state.progress.endpoints.byId[ep.endpointId]) {
            this.state.progress.endpoints.byId[ep.endpointId] = { status: "pending", attempts: 0, lastUpdated: nowIso };
          }
        }
      }
      // mark endpoints pending (existing code adds byId)
      this.config.events?.onExecutionProgress?.({ jobId, total: this.state.progress?.total || 0, completed: this.state.progress?.completed || 0 });
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
      // emit per-endpoint terminal statuses
      for (const r of endpointResults) {
        this.config.events?.onEndpointProgress?.({ jobId, endpointId: r.endpointId, status: r.success ? "success" : "failed", attempt: r.attempts || 1, error: r.error });
      }
      await this.database.recordEndpointResults(jobId, endpointResults);

      const executionSummary: ExecutionResults = {
        results: endpointResults,
        summary: {
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          totalDurationMs: endpointResults.reduce((t, r) => t + r.executionTimeMs, 0),
          successCount: endpointResults.filter(r => r.success).length,
          failureCount: endpointResults.filter(r => !r.success && !r.aborted).length,
        },
      };
      await this.database.recordExecutionSummary(jobId, executionSummary.summary);
      this.state.stats.totalEndpointCalls += endpointResults.length;

      this.state.stats.aiAgentCalls++;
      const scheduleResponse = await this.runScheduleWithWrapper(contextWithTime, executionSummary);
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
}
