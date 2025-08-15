import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";

import type { ExecutionResults, JobContext } from "../../types.js";
import type { AIAgentMetricsEvent, AIAgentPlanResponse, AIAgentScheduleResponse, AIAgentService, MalformedResponseCategory } from "./types.js";

import { type AIAgentConfig, AIAgentConfigSchema } from "../../config.js";
import { classifyPlanError, classifyScheduleError } from "./classification.js";
import { createPlanningSystemPrompt, createSchedulingSystemPrompt, formatContextForPlanning, formatContextForScheduling } from "./formatting.js";
import { optimizeJobContext } from "./prompt-optimization.js";
import { executionPlanSchema, schedulingResponseSchema } from "./schemas.js";
import { validatePlanSemantics, validateScheduleSemantics } from "./semantics.js";

/**
 * Default AI Agent service implementation using Vercel AI SDK
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
    try {
      const optimized = this.optimizeContext(jobContext);
      const systemPrompt = createPlanningSystemPrompt();
      const userPrompt = formatContextForPlanning(optimized);
      const result = await generateObject({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: this.config.temperature ?? 0.2,
        maxRetries: this.config.maxRetries ?? 2,
        schema: executionPlanSchema,
      });
      let plan: AIAgentPlanResponse = result.object;
      if (this.config.validateSemantics) {
        const issues = validatePlanSemantics(plan);
        if (issues.length) {
          if (this.config.semanticStrict) {
            throw new Error(`Semantic validation failed: ${issues.join("; ")}`);
          }
          else {
            plan = { ...plan, reasoning: `${plan.reasoning}\n\n[SemanticWarnings] ${issues.join(" | ")}` };
          }
        }
      }
      return { ...plan, usage: result.usage };
    }
    catch (error) {
      const repaired = await this.tryRepairPlan(error, jobContext);
      if (repaired) {
        this.emit({ type: "repairSuccess", phase: "plan" });
        return repaired;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      const category = classifyPlanError(errorMessage);
      this.emit({ type: "malformed", phase: "plan", category });
      throw new Error(`Error in planExecution [${category}]: ${errorMessage}`);
    }
  }

  async finalizeSchedule(jobContext: JobContext, executionResults: ExecutionResults): Promise<AIAgentScheduleResponse> {
    try {
      const systemPrompt = createSchedulingSystemPrompt();
      const userPrompt = formatContextForScheduling(jobContext, executionResults);
      const result = await generateObject({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: this.config.temperature ?? 0.2,
        maxRetries: this.config.maxRetries ?? 2,
        schema: schedulingResponseSchema,
      });
      let schedule: AIAgentScheduleResponse = result.object;
      if (this.config.validateSemantics) {
        const issues = validateScheduleSemantics(schedule);
        if (issues.length) {
          if (this.config.semanticStrict) {
            throw new Error(`Semantic validation failed: ${issues.join("; ")}`);
          }
          else {
            schedule = { ...schedule, reasoning: `${schedule.reasoning}\n\n[SemanticWarnings] ${issues.join(" | ")}` };
          }
        }
      }
      return { ...schedule, usage: result.usage };
    }
    catch (error) {
      const repaired = await this.tryRepairSchedule(error, jobContext, executionResults);
      if (repaired) {
        this.emit({ type: "repairSuccess", phase: "schedule" });
        return repaired;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      const category = classifyScheduleError(errorMessage);
      this.emit({ type: "malformed", phase: "schedule", category });
      throw new Error(`Error in finalizeSchedule [${category}]: ${errorMessage}`);
    }
  }

  private optimizeContext(jobContext: JobContext): JobContext {
    return optimizeJobContext(jobContext, this.config.promptOptimization);
  }

  private async tryRepairPlan(originalError: unknown, jobContext: JobContext): Promise<AIAgentPlanResponse | null> {
    if (!this.config.repairMalformedResponses)
      return null;
    const errMsg = originalError instanceof Error ? originalError.message : String(originalError);
    const category = classifyPlanError(errMsg);
    const repairable: MalformedResponseCategory[] = ["semantic_violation", "schema_parse_error"];
    if (!repairable.includes(category))
      return null;
    this.emit({ type: "repairAttempt", phase: "plan" });
    if (!/Semantic validation failed|Error parsing|schema/i.test(errMsg))
      return null;
    try {
      const optimized = this.optimizeContext(jobContext);
      const rescuePrompt = `${createPlanningSystemPrompt()}\n\nThe previous response was malformed or semantically invalid (reason: ${errMsg}). Produce a corrected JSON object strictly matching the required schema.`;
      const userPrompt = formatContextForPlanning(optimized);
      const result = await generateObject({
        model: this.model,
        system: rescuePrompt,
        prompt: userPrompt,
        temperature: 0,
        maxRetries: 1,
        schema: executionPlanSchema,
      });
      let plan: AIAgentPlanResponse = result.object;
      if (this.config.validateSemantics) {
        const issues = validatePlanSemantics(plan);
        if (issues.length) {
          if (this.config.semanticStrict)
            throw new Error(`Semantic validation failed after repair: ${issues.join("; ")}`);
          plan = { ...plan, reasoning: `${plan.reasoning}\n\n[SemanticWarnings] ${issues.join(" | ")}` };
        }
      }
      this.emit({ type: "repairSuccess", phase: "plan" });
      return { ...plan, usage: result.usage };
    }
    catch {
      this.emit({ type: "repairFailure", phase: "plan" });
      return null;
    }
  }

  private async tryRepairSchedule(originalError: unknown, jobContext: JobContext, executionResults: ExecutionResults): Promise<AIAgentScheduleResponse | null> {
    if (!this.config.repairMalformedResponses)
      return null;
    const errMsg = originalError instanceof Error ? originalError.message : String(originalError);
    const category = classifyScheduleError(errMsg);
    const repairable: MalformedResponseCategory[] = ["semantic_violation", "schema_parse_error"];
    if (!repairable.includes(category))
      return null;
    this.emit({ type: "repairAttempt", phase: "schedule" });
    if (!/Semantic validation failed|Error parsing|schema/i.test(errMsg))
      return null;
    try {
      const rescuePrompt = `${createSchedulingSystemPrompt()}\n\nThe previous response was malformed or semantically invalid (reason: ${errMsg}). Produce a corrected JSON object strictly matching the required schema.`;
      const userPrompt = formatContextForScheduling(jobContext, executionResults);
      const result = await generateObject({
        model: this.model,
        system: rescuePrompt,
        prompt: userPrompt,
        temperature: 0,
        maxRetries: 1,
        schema: schedulingResponseSchema,
      });
      let schedule: AIAgentScheduleResponse = result.object;
      if (this.config.validateSemantics) {
        const issues = validateScheduleSemantics(schedule);
        if (issues.length) {
          if (this.config.semanticStrict)
            throw new Error(`Semantic validation failed after repair: ${issues.join("; ")}`);
          schedule = { ...schedule, reasoning: `${schedule.reasoning}\n\n[SemanticWarnings] ${issues.join(" | ")}` };
        }
      }
      this.emit({ type: "repairSuccess", phase: "schedule" });
      return { ...schedule, usage: result.usage };
    }
    catch {
      this.emit({ type: "repairFailure", phase: "schedule" });
      return null;
    }
  }
}
