import { randomUUID } from "node:crypto";

import type { EngineConfig } from "../config.js";
import type { AIAgentService, DatabaseService, EndpointExecutorService } from "../services/index.js";
import type { EngineState, ProcessingResult } from "../types.js";

import { processSingleJob } from "./process-job.js";

export type CycleDeps = {
  engine: unknown;
  config: EngineConfig;
  state: EngineState;
  database: DatabaseService;
  executor: EndpointExecutorService;
  aiAgent: AIAgentService;
  log: { info?: (...a: unknown[]) => void; error?: (...a: unknown[]) => void };
  jobEscalationLevels: Map<string, "none" | "warn" | "critical">;
  disabledEndpointMap: Map<string, Set<string>>;
};

export async function processCycle(deps: CycleDeps): Promise<ProcessingResult> {
  const { config, state, database, log } = deps;
  const cycleId = randomUUID();
  const startTime = new Date();
  log.info?.("cycle_start", { cycleId, startTime: startTime.toISOString() });
  state.lastProcessingTime = startTime;

  // Setup cancellation context for cycle
  const abortController = new AbortController();
  state.abortController = { signal: abortController.signal, abort: () => abortController.abort() };
  state.progress = { total: 0, completed: 0, startedAt: startTime.toISOString(), updatedAt: startTime.toISOString(), endpoints: { total: 0, completed: 0 } };

  const events = config.events || {};
  const result: ProcessingResult = { startTime, endTime: new Date(), jobsProcessed: 0, successfulJobs: 0, failedJobs: 0, errors: [] };

  try {
    const maxBatchSize = config.scheduler?.maxBatchSize ?? 20;
    const jobIds = await database.getJobsToProcess(maxBatchSize);
    log.info?.("cycle_jobs_fetched", { cycleId, count: jobIds.length });
    result.jobsProcessed = jobIds.length;
    state.progress.total = jobIds.length;
    state.progress.endpoints = { total: 0, completed: 0 };
    events.onExecutionProgress?.({ total: state.progress.total, completed: state.progress.completed });

    if (jobIds.length === 0) {
      log.info?.("Processing cycle completed: 0/0 jobs successful");
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      return result;
    }

    const concurrency = Math.max(1, config.scheduler?.jobProcessingConcurrency ?? 1);
    let index = 0;
    const next = async (): Promise<void> => {
      const current = index++;
      if (current >= jobIds.length)
        return;
      const jobId = jobIds[current];
      log.info?.("job_start", { cycleId, jobId });
      await processSingleJob({ ...deps, jobId, aggregate: result }).catch(() => { /* errors recorded internally */ });
      log.info?.("job_end", { cycleId, jobId });
      state.progress!.completed++;
      state.progress!.updatedAt = new Date().toISOString();
      events.onExecutionProgress?.({ total: state.progress!.total, completed: state.progress!.completed });
      return next();
    };

    const workers = Array.from({ length: Math.min(concurrency, jobIds.length) }, () => next());
    await Promise.all(workers);
    log.info?.("cycle_summary", { cycleId, jobsProcessed: result.jobsProcessed, successful: result.successfulJobs, failed: result.failedJobs });
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error?.("cycle_error", { cycleId, error: errorMessage });
  }

  result.endTime = new Date();
  result.duration = result.endTime.getTime() - result.startTime.getTime();

  // Aggregate cycle metrics
  state.stats.totalJobsProcessed += result.jobsProcessed;
  state.stats.successfulJobs += result.successfulJobs;
  state.stats.failedJobs += result.failedJobs;
  state.stats.totalCyclesProcessed = (state.stats.totalCyclesProcessed || 0) + 1;
  state.stats.totalProcessingTimeMs = (state.stats.totalProcessingTimeMs || 0) + (result.duration || 0);
  state.stats.lastCycleDurationMs = result.duration;
  state.stats.avgCycleDurationMs = Math.round((state.stats.totalProcessingTimeMs || 0) / (state.stats.totalCyclesProcessed || 1));
  log.info?.("cycle_metrics", { cycleId, durationMs: result.duration, avgCycleDurationMs: state.stats.avgCycleDurationMs });

  // Reset transient state
  state.progress = undefined;
  state.abortController = undefined;
  events.onExecutionProgress?.({ total: result.jobsProcessed, completed: result.successfulJobs + result.failedJobs });

  return result;
}
