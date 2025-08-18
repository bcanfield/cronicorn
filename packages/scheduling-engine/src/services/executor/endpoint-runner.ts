import type { EndpointExecutionResult, EndpointResponseContent, JobContext } from "../../types.js";
import type { AIAgentPlanResponse } from "../ai-agent/index.js";
import type { DefaultEndpointExecutorService } from "./endpoint-executor.js";

import { classifyEndpointFailure } from "./errors.js";

// Core single-endpoint execution (migrated from executor class to reduce file size)
export async function executeEndpointWithRetry(params: {
  executor: DefaultEndpointExecutorService;
  jobContext: JobContext;
  plannedEndpoint: AIAgentPlanResponse["endpointsToCall"][0];
}): Promise<EndpointExecutionResult> {
  const { executor, jobContext, plannedEndpoint } = params;
  const { events, config, circuitBreaker, retryPolicy, log } = executor;
  const jobId = jobContext.job.id;
  const externalAbort = jobContext.executionContext?.abortSignal; // optional propagation
  events?.onEndpointProgress?.({ jobId, endpointId: plannedEndpoint.endpointId, status: "in_progress", attempt: 0 });
  const startTimeOverall = Date.now();
  const timestamp = new Date().toISOString();
  const endpointConfig = jobContext.endpoints.find(e => e.id === plannedEndpoint.endpointId);
  if (!endpointConfig) {
    return {
      endpointId: plannedEndpoint.endpointId,
      success: false,
      statusCode: 0,
      executionTimeMs: Date.now() - startTimeOverall,
      timestamp,
      error: `Endpoint ${plannedEndpoint.endpointId} not found in job context`,
    };
  }
  if (!circuitBreaker.shouldAllow(plannedEndpoint.endpointId)) {
    log.info?.("endpoint_short_circuit", { endpointId: plannedEndpoint.endpointId, reason: "circuit_open" });
    return {
      endpointId: plannedEndpoint.endpointId,
      success: false,
      statusCode: 0,
      executionTimeMs: Date.now() - startTimeOverall,
      timestamp,
      error: "circuit_open",
    };
  }
  let lastError: string | undefined;
  let lastStatus: number | undefined;
  let truncated = false;
  let lastResponseContent: EndpointResponseContent = null;
  const maxAttempts = (config.maxEndpointRetries ?? 0) + 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // derive warn/critical attempt thresholds from config escalation ratios relative to maxAttempts
    const warnThresholdAttempt = Math.max(2, Math.ceil(maxAttempts * (executor.config.escalation?.warnFailureRatio ?? 0.25)));
    const criticalThresholdAttempt = Math.max(warnThresholdAttempt + 1, Math.ceil(maxAttempts * (executor.config.escalation?.criticalFailureRatio ?? 0.5)));
    const attemptStart = Date.now();
    let aborted = false;
    const sampled = Math.random() < (config.logSamplingRate ?? 1);
    try {
      if (sampled) {
        log.info?.("endpoint_attempt", { endpointId: plannedEndpoint.endpointId, attempt, jobId, cycleId: jobContext.executionContext?.currentTime });
      }
      events?.onEndpointProgress?.({ jobId, endpointId: plannedEndpoint.endpointId, status: "in_progress", attempt });
      let url = endpointConfig.url;
      let body: string | null = null;
      const headers: Record<string, string> = {
        ...(jobContext.job.defaultHeaders || {}),
        ...(endpointConfig.defaultHeaders || {}),
        ...(plannedEndpoint.headers || {}),
      };
      if (endpointConfig.method !== "GET" && !headers["Content-Type"])
        headers["Content-Type"] = "application/json";
      if (endpointConfig.method === "GET" && plannedEndpoint.parameters) {
        const params = new URLSearchParams();
        Object.entries(plannedEndpoint.parameters).forEach(([k, v]) => {
          if (v !== undefined && v !== null)
            params.append(k, String(v));
        });
        const qs = params.toString();
        if (qs)
          url += url.includes("?") ? `&${qs}` : `?${qs}`;
      }
      else if (plannedEndpoint.parameters) {
        body = JSON.stringify(plannedEndpoint.parameters);
      }
      const timeoutMs = endpointConfig.timeoutMs || config.defaultTimeoutMs || 10000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        aborted = true;
      }, timeoutMs);
      if (externalAbort) {
        if (externalAbort.aborted) {
          controller.abort();
          aborted = true;
        }
        else {
          const onAbort = () => {
            controller.abort();
            aborted = true;
          };
          externalAbort.addEventListener("abort", onAbort, { once: true });
        }
      }
      const response = await executor.fetch(url, { method: endpointConfig.method, headers, body, signal: controller.signal });
      clearTimeout(timeoutId);
      lastStatus = response.status;
      const text = await response.text().catch(() => "");
      let responseText = text;
      const contentLengthLimit = config.responseContentLengthLimit || 10000;
      if (responseText.length > contentLengthLimit) {
        responseText = responseText.substring(0, contentLengthLimit);
        truncated = true;
      }
      let parsed: unknown = responseText;
      try {
        parsed = JSON.parse(responseText);
      }
      catch {
        /* not json */
      }
      lastResponseContent = typeof parsed === "string" || Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? { ...parsed } : null;
      const success = response.ok;
      if (success) {
        const prevState = circuitBreaker.getState(plannedEndpoint.endpointId).state;
        const newState = circuitBreaker.recordSuccess(plannedEndpoint.endpointId);
        if (newState !== prevState)
          events?.onCircuitStateChange?.({ endpointId: plannedEndpoint.endpointId, from: prevState, to: newState });
        if (sampled) {
          log.info?.("endpoint_success", { endpointId: plannedEndpoint.endpointId, status: response.status, attempt, elapsedMs: Date.now() - attemptStart, jobId });
        }
        events?.onEndpointProgress?.({ jobId, endpointId: plannedEndpoint.endpointId, status: "success", attempt });
        return {
          endpointId: plannedEndpoint.endpointId,
          success: true,
          statusCode: response.status,
          executionTimeMs: Date.now() - attemptStart,
          timestamp,
          responseContent: lastResponseContent,
          truncated,
          attempts: attempt,
          aborted: false,
        };
      }
      const classification = classifyEndpointFailure({ statusCode: response.status });
      const decision = retryPolicy.evaluate({ attempt, maxAttempts, category: classification.category, transient: classification.transient, statusCode: response.status, warnThresholdAttempt, criticalThresholdAttempt });
      if (decision === "retry") {
        events?.onRetryAttempt?.({ jobId, endpointId: plannedEndpoint.endpointId, attempt });
        events?.onEndpointProgress?.({ jobId, endpointId: plannedEndpoint.endpointId, status: "in_progress", attempt });
        const delay = retryPolicy.nextDelay ? retryPolicy.nextDelay({ attempt, maxAttempts, category: classification.category, transient: classification.transient, statusCode: response.status, warnThresholdAttempt, criticalThresholdAttempt }) : 0;
        if (delay > 0)
          await new Promise(r => setTimeout(r, delay));
        if (sampled) {
          log.info?.("endpoint_retry_scheduled", { endpointId: plannedEndpoint.endpointId, attempt, nextInMs: delay, jobId });
        }
        continue;
      }
      const prevState = circuitBreaker.getState(plannedEndpoint.endpointId).state;
      const newState = circuitBreaker.recordFailure(plannedEndpoint.endpointId);
      if (newState !== prevState)
        events?.onCircuitStateChange?.({ endpointId: plannedEndpoint.endpointId, from: prevState, to: newState, failures: circuitBreaker.getState(plannedEndpoint.endpointId).failures });
      log.error?.("endpoint_failure", { endpointId: plannedEndpoint.endpointId, status: response.status, attempt, classification: classification.category, jobId });
      events?.onEndpointProgress?.({ jobId, endpointId: plannedEndpoint.endpointId, status: "failed", attempt, error: `HTTP ${response.status}` });
      return { endpointId: plannedEndpoint.endpointId, success: false, statusCode: response.status, executionTimeMs: Date.now() - attemptStart, timestamp, responseContent: lastResponseContent, truncated, error: `HTTP ${response.status}`, attempts: attempt, aborted };
    }
    catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = msg;
      const classification = classifyEndpointFailure({ error: err, statusCode: lastStatus, aborted });
      const decision = retryPolicy.evaluate({ attempt, maxAttempts, category: classification.category, transient: classification.transient, statusCode: lastStatus, errorMessage: msg, warnThresholdAttempt, criticalThresholdAttempt });
      if (decision === "retry") {
        events?.onRetryAttempt?.({ jobId, endpointId: plannedEndpoint.endpointId, attempt });
        events?.onEndpointProgress?.({ jobId, endpointId: plannedEndpoint.endpointId, status: "in_progress", attempt });
        const delay = retryPolicy.nextDelay ? retryPolicy.nextDelay({ attempt, maxAttempts, category: classification.category, transient: classification.transient, statusCode: lastStatus, errorMessage: msg, warnThresholdAttempt, criticalThresholdAttempt }) : 0;
        if (delay > 0)
          await new Promise(r => setTimeout(r, delay));
        if (sampled) {
          log.info?.("endpoint_retry_scheduled", { endpointId: plannedEndpoint.endpointId, attempt, nextInMs: delay, jobId, error: msg });
        }
        continue;
      }
      // Only record circuit breaker failure if not aborted
      if (!aborted) {
        const prevState = circuitBreaker.getState(plannedEndpoint.endpointId).state;
        const newState = circuitBreaker.recordFailure(plannedEndpoint.endpointId);
        if (newState !== prevState)
          events?.onCircuitStateChange?.({ endpointId: plannedEndpoint.endpointId, from: prevState, to: newState, failures: circuitBreaker.getState(plannedEndpoint.endpointId).failures });
        log.error?.("endpoint_failure", { endpointId: plannedEndpoint.endpointId, attempt, error: msg, classification: classification.category, jobId });
      }
      else if (sampled) {
        log.info?.("endpoint_aborted", { endpointId: plannedEndpoint.endpointId, attempt, jobId });
      }
      events?.onEndpointProgress?.({ jobId, endpointId: plannedEndpoint.endpointId, status: "failed", attempt, error: msg });
      return { endpointId: plannedEndpoint.endpointId, success: false, statusCode: lastStatus || 0, executionTimeMs: Date.now() - startTimeOverall, timestamp, error: msg, attempts: attempt, aborted };
    }
  }
  events?.onRetryExhausted?.({ jobId, endpointId: plannedEndpoint.endpointId, attempts: maxAttempts });
  events?.onEndpointProgress?.({ jobId, endpointId: plannedEndpoint.endpointId, status: "failed", attempt: maxAttempts, error: lastError });
  log.error?.("endpoint_exhausted", { endpointId: plannedEndpoint.endpointId, attempts: maxAttempts, error: lastError, jobId });
  return { endpointId: plannedEndpoint.endpointId, success: false, statusCode: lastStatus || 0, executionTimeMs: Date.now() - startTimeOverall, timestamp, error: lastError || "Unknown error", responseContent: lastResponseContent, truncated, attempts: maxAttempts, aborted: true };
}
