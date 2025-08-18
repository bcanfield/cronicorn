import NodeFetch from "node-fetch";
import PQueue from "p-queue";

import type { EventsConfig, ExecutionConfig } from "../../config.js";
import type { EndpointExecutionResult, EndpointResponseContent, JobContext } from "../../types.js";
import type { AIAgentPlanResponse } from "../ai-agent/index.js";

import { classifyEndpointFailure } from "./errors.js";
import { DefaultRetryPolicy, type RetryPolicy } from "./retry-policy.js";

/**
 * Endpoint executor service
 */
export type EndpointExecutorService = {
  /**
   * Execute endpoints according to execution plan
   *
   * @param jobContext Current job context
   * @param executionPlan Plan from AI agent
   * @returns Execution results for all endpoints
   */
  executeEndpoints: (
    jobContext: JobContext,
    executionPlan: AIAgentPlanResponse
  ) => Promise<EndpointExecutionResult[]>;
};

/**
 * Default implementation of Endpoint Executor Service
 */
export class DefaultEndpointExecutorService implements EndpointExecutorService {
  private config: ExecutionConfig;
  private fetch: typeof NodeFetch;
  private retryPolicy: RetryPolicy;
  private events?: EventsConfig;

  /**
   * Create a new executor service
   *
   * @param config Execution configuration
   * @param events Events configuration
   */
  constructor(config: ExecutionConfig, events?: EventsConfig) {
    this.config = config;
    this.fetch = NodeFetch;
    this.retryPolicy = new DefaultRetryPolicy();
    this.events = events;
  }

  /**
   * Execute endpoints according to execution plan
   *
   * @param jobContext Current job context
   * @param executionPlan Plan from AI agent
   * @returns Execution results for all endpoints
   */
  async executeEndpoints(
    jobContext: JobContext,
    executionPlan: AIAgentPlanResponse,
  ): Promise<EndpointExecutionResult[]> {
    // Handle different execution strategies
    switch (executionPlan.executionStrategy) {
      case "sequential":
        return this.executeSequentially(jobContext, executionPlan);
      case "parallel":
        return this.executeInParallel(jobContext, executionPlan);
      case "mixed":
        return this.executeWithDependencies(jobContext, executionPlan);
      default:
        throw new Error(`Unsupported execution strategy: ${executionPlan.executionStrategy}`);
    }
  }

  /**
   * Execute endpoints sequentially in priority order
   *
   * @param jobContext Current job context
   * @param executionPlan Plan from AI agent
   * @returns Execution results
   */
  private async executeSequentially(
    jobContext: JobContext,
    executionPlan: AIAgentPlanResponse,
  ): Promise<EndpointExecutionResult[]> {
    // Sort endpoints by priority (lower number = higher priority)
    const sortedEndpoints = [...executionPlan.endpointsToCall].sort(
      (a, b) => a.priority - b.priority,
    );

    const results: EndpointExecutionResult[] = [];

    // Execute endpoints one by one in priority order
    for (const endpoint of sortedEndpoints) {
      const result = await this.executeEndpoint(jobContext, endpoint);
      results.push(result);

      // If endpoint is critical and failed, stop execution
      if (endpoint.critical && !result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Execute endpoints in parallel
   *
   * @param jobContext Current job context
   * @param executionPlan Plan from AI agent
   * @returns Execution results
   */
  private async executeInParallel(
    jobContext: JobContext,
    executionPlan: AIAgentPlanResponse,
  ): Promise<EndpointExecutionResult[]> {
    // Create a queue with concurrency limit
    const concurrencyLimit = executionPlan.concurrencyLimit
      || this.config.defaultConcurrencyLimit
      || 3;

    const queue = new PQueue({ concurrency: concurrencyLimit });
    const results: EndpointExecutionResult[] = [];

    // Execute all endpoints via the queue
    const promises = executionPlan.endpointsToCall.map(endpoint =>
      queue.add(async () => {
        const result = await this.executeEndpoint(jobContext, endpoint);
        results.push(result);
      }),
    );

    // Wait for all to complete
    await Promise.all(promises);

    return results;
  }

  /**
   * Execute endpoints with dependency order
   *
   * @param jobContext Current job context
   * @param executionPlan Plan from AI agent
   * @returns Execution results
   */
  private async executeWithDependencies(
    jobContext: JobContext,
    executionPlan: AIAgentPlanResponse,
  ): Promise<EndpointExecutionResult[]> {
    const concurrencyLimit = executionPlan.concurrencyLimit
      || this.config.defaultConcurrencyLimit
      || 3;

    const queue = new PQueue({ concurrency: concurrencyLimit });
    const results: EndpointExecutionResult[] = [];
    const completedEndpointIds = new Set<string>();
    const failedCriticalEndpoints = new Set<string>();

    // Check if all dependencies for an endpoint are satisfied
    const areDependenciesMet = (endpoint: typeof executionPlan.endpointsToCall[0]): boolean => {
      if (!endpoint.dependsOn?.length) {
        return true;
      }

      // Check if any dependencies are critical and failed
      const hasFailedCriticalDependency = endpoint.dependsOn.some(depId =>
        failedCriticalEndpoints.has(depId),
      );

      if (hasFailedCriticalDependency) {
        return false;
      }

      // Check if all dependencies are completed
      return endpoint.dependsOn.every(depId => completedEndpointIds.has(depId));
    };

    // Attempt to execute all endpoints with dependency ordering
    const executeAll = async (): Promise<void> => {
      // Find endpoints that can be executed now
      const readyEndpoints = executionPlan.endpointsToCall
        .filter(endpoint => !completedEndpointIds.has(endpoint.endpointId))
        .filter(areDependenciesMet);

      // If no endpoints are ready and we haven't completed all,
      // we might have a circular dependency
      if (readyEndpoints.length === 0) {
        if (completedEndpointIds.size < executionPlan.endpointsToCall.length) {
          const pendingEndpoints = executionPlan.endpointsToCall
            .filter(endpoint => !completedEndpointIds.has(endpoint.endpointId))
            .map(endpoint => endpoint.endpointId);

          throw new Error(`Possible circular dependency detected for endpoints: ${pendingEndpoints.join(", ")}`);
        }
        return;
      }

      // Create a list to hold all execution promises
      const batchPromises = [];

      // Execute all ready endpoints
      for (const endpoint of readyEndpoints) {
        const promise = queue.add(async () => {
          const result = await this.executeEndpoint(jobContext, endpoint);
          results.push(result);
          completedEndpointIds.add(endpoint.endpointId);

          // If critical endpoint failed, add to failed critical set
          if (endpoint.critical && !result.success) {
            failedCriticalEndpoints.add(endpoint.endpointId);
          }
        });
        batchPromises.push(promise);
      }

      // Wait for all current batch to complete
      await Promise.all(batchPromises);

      // Continue with next batch if there are more endpoints
      if (completedEndpointIds.size < executionPlan.endpointsToCall.length) {
        await executeAll();
      }
    };

    // Start execution
    await executeAll();
    return results;
  }

  /**
   * Execute a single endpoint
   *
   * @param jobContext Current job context
   * @param endpoint Endpoint to execute
   * @returns Execution result
   */
  private async executeEndpoint(
    jobContext: JobContext,
    endpoint: AIAgentPlanResponse["endpointsToCall"][0],
  ): Promise<EndpointExecutionResult> {
    // retry-enabled execution
    const maxAttempts = this.config.maxEndpointRetries ?? 0;
    const startTimeOverall = Date.now();
    const timestamp = new Date().toISOString();

    const onRetryAttempt = this.events?.onRetryAttempt;
    const onRetryExhausted = this.events?.onRetryExhausted;

    // locate endpoint config
    const endpointConfig = jobContext.endpoints.find(e => e.id === endpoint.endpointId);
    if (!endpointConfig) {
      return {
        endpointId: endpoint.endpointId,
        success: false,
        statusCode: 0,
        executionTimeMs: Date.now() - startTimeOverall,
        timestamp,
        error: `Endpoint ${endpoint.endpointId} not found in job context`,
      };
    }

    let lastError: string | undefined;
    let lastStatus: number | undefined;
    let truncated = false;
    let lastResponseContent: EndpointResponseContent = null;

    for (let attempt = 1; attempt <= Math.max(1, maxAttempts + 1); attempt++) {
      const attemptStart = Date.now();
      let aborted = false;
      try {
        // Build URL + body per attempt (parameters stable for now)
        let url = endpointConfig.url;
        let body: string | null = null;
        const headers: Record<string, string> = {
          ...(jobContext.job.defaultHeaders || {}),
          ...(endpointConfig.defaultHeaders || {}),
          ...(endpoint.headers || {}),
        };
        if (endpointConfig.method !== "GET" && !headers["Content-Type"]) {
          headers["Content-Type"] = "application/json";
        }
        if (endpointConfig.method === "GET" && endpoint.parameters) {
          const params = new URLSearchParams();
          Object.entries(endpoint.parameters).forEach(([k, v]) => {
            if (v !== undefined && v !== null)
              params.append(k, String(v));
          });
          const qs = params.toString();
          if (qs) url += url.includes("?") ? `&${qs}` : `?${qs}`;
        }
        else if (endpoint.parameters) {
          body = JSON.stringify(endpoint.parameters);
        }
        const timeoutMs = endpointConfig.timeoutMs || this.config.defaultTimeoutMs || 10000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          aborted = true;
        }, timeoutMs);

        const response = await this.fetch(url, { method: endpointConfig.method, headers, body, signal: controller.signal });
        clearTimeout(timeoutId);
        lastStatus = response.status;
        const text = await response.text().catch(() => "");
        let responseText = text;
        const contentLengthLimit = this.config.responseContentLengthLimit || 10000;
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
          return {
            endpointId: endpoint.endpointId,
            success: true,
            statusCode: response.status,
            executionTimeMs: Date.now() - attemptStart,
            timestamp,
            responseContent: lastResponseContent,
            truncated,
            attempts: attempt,
          };
        }
        // classify non-OK status for retry decision
        const classification = classifyEndpointFailure({ statusCode: response.status });
        const decision = this.retryPolicy.evaluate({
          attempt,
          maxAttempts: maxAttempts + 1,
            category: classification.category,
            transient: classification.transient,
            statusCode: response.status,
        });
        if (decision === "retry") {
          onRetryAttempt?.({ jobId: jobContext.job.id, endpointId: endpoint.endpointId, attempt });
          const delay = this.retryPolicy.nextDelay ? this.retryPolicy.nextDelay({
            attempt,
            maxAttempts: maxAttempts + 1,
            category: classification.category,
            transient: classification.transient,
            statusCode: response.status,
          }) : 0;
          if (delay > 0) await new Promise(r => setTimeout(r, delay));
          continue;
        }
        return {
          endpointId: endpoint.endpointId,
          success: false,
          statusCode: response.status,
          executionTimeMs: Date.now() - attemptStart,
          timestamp,
          responseContent: lastResponseContent,
          truncated,
          error: `HTTP ${response.status}`,
          attempts: attempt,
        };
      }
      catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        const classification = classifyEndpointFailure({ error: err, statusCode: lastStatus, aborted });
        const decision = this.retryPolicy.evaluate({
          attempt,
          maxAttempts: maxAttempts + 1,
          category: classification.category,
          transient: classification.transient,
          statusCode: lastStatus,
          errorMessage: msg,
        });
        if (decision === "retry") {
          onRetryAttempt?.({ jobId: jobContext.job.id, endpointId: endpoint.endpointId, attempt });
          const delay = this.retryPolicy.nextDelay ? this.retryPolicy.nextDelay({
            attempt,
            maxAttempts: maxAttempts + 1,
            category: classification.category,
            transient: classification.transient,
            statusCode: lastStatus,
            errorMessage: msg,
          }) : 0;
          if (delay > 0) await new Promise(r => setTimeout(r, delay));
          continue;
        }
        return {
          endpointId: endpoint.endpointId,
          success: false,
          statusCode: lastStatus || 0,
          executionTimeMs: Date.now() - startTimeOverall,
          timestamp,
          error: msg,
          attempts: attempt,
        };
      }
    }

    // exhausted loop fallback
    onRetryExhausted?.({ jobId: jobContext.job.id, endpointId: endpoint.endpointId, attempts: maxAttempts + 1 });
    return {
      endpointId: endpoint.endpointId,
      success: false,
      statusCode: lastStatus || 0,
      executionTimeMs: Date.now() - startTimeOverall,
      timestamp,
      error: lastError || "Unknown error",
      responseContent: lastResponseContent,
      truncated,
      attempts: maxAttempts + 1,
    };
  }
}
