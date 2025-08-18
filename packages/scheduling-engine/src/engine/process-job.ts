import type { EngineConfig } from "../config.js";
import type { AIAgentService, DatabaseService, EndpointExecutorService } from "../services/index.js";
import type { EngineState, ExecutionResults, JobContext, ProcessingResult } from "../types.js";

import { runPlanWithWrapper, runScheduleWithWrapper } from "./ai-wrappers.js";

export type JobDeps = {
  config: EngineConfig;
  state: EngineState;
  database: DatabaseService;
  executor: EndpointExecutorService;
  aiAgent: AIAgentService;
  log: { info?: (...a: unknown[]) => void; error?: (...a: unknown[]) => void };
  jobEscalationLevels: Map<string, "none" | "warn" | "critical">;
  disabledEndpointMap: Map<string, Set<string>>;
  jobId: string;
  aggregate: ProcessingResult;
};

export async function processSingleJob(deps: JobDeps): Promise<void> {
  const { jobId, database, state, config, executor } = deps;
  try {
    const locked = await database.lockJob(jobId, new Date(Date.now() + (config.scheduler?.staleLockThresholdMs ?? 300000)));
    if (!locked)
      return;

    try {
      await database.updateExecutionStatus?.(jobId, "RUNNING");
    }
    catch { /* optional */ }

    const jobContext = await database.getJobContext(jobId);
    if (!jobContext) {
      await database.unlockJob(jobId);
      return;
    }

    const contextWithTime: JobContext = {
      ...jobContext,
      executionContext: {
        ...jobContext.executionContext,
        currentTime: new Date().toISOString(),
        systemEnvironment: (() => {
          const env = jobContext.executionContext?.systemEnvironment;
          return env === "production" || env === "development" || env === "test" ? env : "production";
        })(),
        abortSignal: config.execution.allowCancellation ? state.abortController?.signal : undefined,
      },
    };

    state.stats.aiAgentCalls++;
    const executionPlan = await runPlanWithWrapper({ aiAgent: deps.aiAgent, config, state }, contextWithTime);

    if (state.progress?.endpoints) {
      state.progress.endpoints.total += executionPlan.endpointsToCall.length;
      if (!state.progress.endpoints.byId)
        state.progress.endpoints.byId = {};
      const nowIso = new Date().toISOString();
      for (const ep of executionPlan.endpointsToCall) {
        if (!state.progress.endpoints.byId[ep.endpointId]) {
          state.progress.endpoints.byId[ep.endpointId] = { status: "pending", attempts: 0, lastUpdated: nowIso };
        }
      }
    }
    config.events?.onExecutionProgress?.({ jobId, total: state.progress?.total || 0, completed: state.progress?.completed || 0 });

    if (executionPlan.usage && config.metrics?.trackTokenUsage) {
      const { inputTokens = 0, outputTokens = 0, totalTokens = 0, reasoningTokens, cachedInputTokens } = executionPlan.usage;
      state.stats.aiInputTokens = (state.stats.aiInputTokens || 0) + inputTokens;
      state.stats.aiOutputTokens = (state.stats.aiOutputTokens || 0) + outputTokens;
      state.stats.aiTotalTokens = (state.stats.aiTotalTokens || 0) + totalTokens;
      try {
        await database.updateJobTokenUsage?.({
          jobId,
          inputTokensDelta: inputTokens,
          outputTokensDelta: outputTokens,
          reasoningTokensDelta: reasoningTokens,
          cachedInputTokensDelta: cachedInputTokens,
        });
      }
      catch { /* optional */ }
    }

    await database.recordExecutionPlan(jobId, executionPlan);

    const disabledSet = deps.disabledEndpointMap.get(jobId);
    const filteredPlan = disabledSet && disabledSet.size > 0 && executionPlan.executionStrategy !== "mixed"
      ? { ...executionPlan, endpointsToCall: executionPlan.endpointsToCall.filter(ep => !disabledSet.has(ep.endpointId)) }
      : executionPlan;

    const endpointResults = await executor.executeEndpoints(contextWithTime, filteredPlan);

    for (const r of endpointResults) {
      config.events?.onEndpointProgress?.({ jobId, endpointId: r.endpointId, status: r.success ? "success" : "failed", attempt: r.attempts || 1, error: r.error });
    }
    await database.recordEndpointResults(jobId, endpointResults);

    const failedNonAborted = endpointResults.filter(r => !r.success && !r.aborted);
    const failures = failedNonAborted.length;
    const attempted = endpointResults.length || 1;
    const ratio = failures / attempted;
    const warnRatio = config.execution.escalation?.warnFailureRatio ?? 0.25;
    const criticalRatio = config.execution.escalation?.criticalFailureRatio ?? 0.5;
    const escalationLevel: "none" | "warn" | "critical" = ratio >= criticalRatio ? "critical" : ratio >= warnRatio ? "warn" : "none";

    let recoveryAction: "NONE" | "BACKOFF_ONLY" | "REDUCE_CONCURRENCY" | "DISABLE_ENDPOINT" = "NONE";
    if (escalationLevel === "warn")
      recoveryAction = "BACKOFF_ONLY";
    else if (escalationLevel === "critical")
      recoveryAction = "DISABLE_ENDPOINT";

    let disabledEndpoints: string[] | undefined;
    if (recoveryAction === "DISABLE_ENDPOINT") {
      const existing = deps.disabledEndpointMap.get(jobId) ?? new Set<string>();
      for (const f of failedNonAborted)
        existing.add(f.endpointId);
      if (existing.size > 0) {
        deps.disabledEndpointMap.set(jobId, existing);
        disabledEndpoints = Array.from(existing);
      }
    }

    const executionSummary: ExecutionResults = {
      results: endpointResults,
      summary: {
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        totalDurationMs: endpointResults.reduce((t, r) => t + r.executionTimeMs, 0),
        successCount: endpointResults.filter(r => r.success).length,
        failureCount: failures,
        abortedCount: endpointResults.filter(r => r.aborted).length,
        escalationLevel,
        recoveryAction,
        disabledEndpoints,
      },
    };

    const prevLevel = deps.jobEscalationLevels.get(jobId) || "none";
    if ((escalationLevel === "warn" || escalationLevel === "critical") && escalationLevel !== prevLevel) {
      deps.jobEscalationLevels.set(jobId, escalationLevel);
      config.events?.onEscalation?.({ jobId, level: escalationLevel, failureCount: failures, abortedCount: executionSummary.summary.abortedCount, recoveryAction });
    }
    else if (escalationLevel === "none" && prevLevel !== "none") {
      deps.jobEscalationLevels.set(jobId, "none");
    }

    await database.recordExecutionSummary(jobId, executionSummary.summary);
    state.stats.totalEndpointCalls += endpointResults.length;

    state.stats.aiAgentCalls++;
    const scheduleResponse = await runScheduleWithWrapper({ aiAgent: deps.aiAgent, config, state }, contextWithTime, executionSummary);
    if (scheduleResponse.usage && config.metrics?.trackTokenUsage) {
      const { inputTokens = 0, outputTokens = 0, totalTokens = 0, reasoningTokens, cachedInputTokens } = scheduleResponse.usage;
      state.stats.aiInputTokens = (state.stats.aiInputTokens || 0) + inputTokens;
      state.stats.aiOutputTokens = (state.stats.aiOutputTokens || 0) + outputTokens;
      state.stats.aiTotalTokens = (state.stats.aiTotalTokens || 0) + totalTokens;
      try {
        await database.updateJobTokenUsage?.({
          jobId,
          inputTokensDelta: inputTokens,
          outputTokensDelta: outputTokens,
          reasoningTokensDelta: reasoningTokens,
          cachedInputTokensDelta: cachedInputTokens,
        });
      }
      catch { /* optional */ }
    }

    await database.updateJobSchedule(jobId, scheduleResponse);
    await database.unlockJob(jobId);
    deps.aggregate.successfulJobs++;
  }
  catch (jobError) {
    deps.aggregate.failedJobs++;
    const errorMessage = jobError instanceof Error ? jobError.message : String(jobError);
    let code: "plan_error" | "schedule_error" | "execution_error" | "unknown_error" = "unknown_error";
    if (/planExecution/i.test(errorMessage) || /Semantic validation failed/i.test(errorMessage))
      code = "plan_error";
    else if (/finalizeSchedule/i.test(errorMessage) || /schedule/i.test(errorMessage))
      code = "schedule_error";
    else if (/endpoint/i.test(errorMessage))
      code = "execution_error";
    deps.aggregate.errors.push({ message: errorMessage, jobId, code });
    try {
      await database.recordJobError(jobId, errorMessage);
      try {
        await database.updateExecutionStatus?.(jobId, "FAILED", errorMessage);
      }
      catch { /* optional */ }
      await database.unlockJob(jobId);
    }
    catch { /* swallow */ }
  }
}
