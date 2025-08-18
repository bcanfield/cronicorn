import NodeFetch from "node-fetch";

import type { EventsConfig, ExecutionConfig } from "../../config.js";
import type { EndpointExecutionResult, JobContext } from "../../types.js";
import type { AIAgentPlanResponse } from "../ai-agent/index.js";

import { EndpointCircuitBreaker } from "./circuit-breaker.js";
import { executeEndpointWithRetry } from "./endpoint-runner.js";
import { DefaultRetryPolicy, type RetryPolicy } from "./retry-policy.js";
import { executeWithDependencies } from "./strategies/mixed.js";
import { executeInParallel } from "./strategies/parallel.js";
import { executeSequentially } from "./strategies/sequential.js";

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
  config: ExecutionConfig;
  fetch: typeof NodeFetch;
  retryPolicy: RetryPolicy;
  events?: EventsConfig;
  circuitBreaker: EndpointCircuitBreaker;
  log: { info?: (msg: unknown, meta?: unknown) => void; error?: (msg: unknown, meta?: unknown) => void } = {};

  /**
   * Create a new executor service
   *
   * @param config Execution configuration
   * @param events Events configuration
   */
  constructor(
    config: ExecutionConfig,
    events?: EventsConfig,
    logger?: { info?: (msg: unknown, meta?: unknown) => unknown; error?: (msg: unknown, meta?: unknown) => unknown },
  ) {
    this.config = config;
    this.fetch = NodeFetch;
    this.retryPolicy = new DefaultRetryPolicy();
    this.events = events;
    this.circuitBreaker = new EndpointCircuitBreaker(this.config);
    if (logger) {
      if (typeof logger.info === "function") {
        this.log.info = (m: unknown, meta?: unknown) => {
          try {
            if (logger.info) {
              logger.info(m, meta);
            }
          }
          catch {
            /* swallow */
          }
        };
      }
      if (typeof logger.error === "function") {
        this.log.error = (m: unknown, meta?: unknown) => {
          try {
            if (logger.error) {
              logger.error(m, meta);
            }
          }
          catch {
            /* swallow */
          }
        };
      }
    }
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
    switch (executionPlan.executionStrategy) {
      case "sequential":
        return executeSequentially(this, jobContext, executionPlan);
      case "parallel":
        return executeInParallel(this, jobContext, executionPlan);
      case "mixed":
        return executeWithDependencies(this, jobContext, executionPlan);
      default:
        throw new Error(`Unsupported execution strategy: ${executionPlan.executionStrategy}`);
    }
  }

  /** @internal */
  async _executeSingle(
    jobContext: JobContext,
    endpoint: AIAgentPlanResponse["endpointsToCall"][0],
  ): Promise<EndpointExecutionResult> {
    return executeEndpointWithRetry({ executor: this, jobContext, plannedEndpoint: endpoint });
  }
}
