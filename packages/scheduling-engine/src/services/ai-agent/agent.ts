import { openai } from "@ai-sdk/openai";

import type { ExecutionResults, JobContext } from "../../types.js";
import type { AIAgentMetricsEvent, AIAgentPlanResponse, AIAgentScheduleResponse, AIAgentService } from "./types.js";

import { type AIAgentConfig, AIAgentConfigSchema } from "../../config.js";
import { planExecutionCore } from "./plan.js";
import { scheduleExecutionCore } from "./schedule.js";

/**
 * Orchestrates AI planning & scheduling by delegating to core plan/schedule modules.
 * Holds validated config + model instance and wires metrics emit hook.
 */
export class DefaultAIAgentService implements AIAgentService {
  private config: AIAgentConfig;
  private model: ReturnType<typeof openai>;

  constructor(config: Partial<AIAgentConfig>) {
    this.config = AIAgentConfigSchema.parse(config || {});
    this.model = openai(this.config.model);
  }

  private emit(event: AIAgentMetricsEvent) {
    this.config.metricsHook?.(event);
  }

  async planExecution(jobContext: JobContext): Promise<AIAgentPlanResponse> {
    return planExecutionCore({
      jobContext,
      config: this.config,
      model: this.model,
      emit: (e: AIAgentMetricsEvent) => this.emit(e),
    });
  }

  async finalizeSchedule(jobContext: JobContext, executionResults: ExecutionResults): Promise<AIAgentScheduleResponse> {
    return scheduleExecutionCore({
      jobContext,
      executionResults,
      config: this.config,
      model: this.model,
      emit: (e: AIAgentMetricsEvent) => this.emit(e),
    });
  }
}
