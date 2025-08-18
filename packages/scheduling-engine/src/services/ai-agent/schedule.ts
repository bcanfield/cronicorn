import { generateObject, type LanguageModel } from "ai";

import type { AIAgentConfig } from "../../config.js";
import type { ExecutionResults, JobContext } from "../../types.js";
import type { AIAgentMetricsEvent, AIAgentScheduleResponse } from "./types.js";

import { classifyScheduleError } from "./classification.js";
import { MalformedResponseError } from "./errors.js";
import { createSchedulingSystemPrompt, formatContextForScheduling } from "./formatting.js";
import { schedulingResponseSchema } from "./schemas.js";
import { salvageSchedule, validateScheduleSemantics } from "./semantics.js";

/**
 * Core scheduling logic: derives nextRunAt from context + execution results,
 * enforces semantic rules, attempts a single structured repair when enabled.
 */

export type ScheduleCoreParams = {
  jobContext: JobContext;
  executionResults: ExecutionResults;
  config: AIAgentConfig;
  model: LanguageModel;
  emit: (e: AIAgentMetricsEvent) => void;
};

export async function scheduleExecutionCore({ jobContext, executionResults, config, model, emit }: ScheduleCoreParams): Promise<AIAgentScheduleResponse> {
  try {
    const systemPrompt = createSchedulingSystemPrompt();
    const userPrompt = formatContextForScheduling(jobContext, executionResults);
    const result = await generateObject({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: config.temperature ?? 0.2,
      maxRetries: config.maxRetries ?? 2,
      schema: schedulingResponseSchema,
    });
    let schedule: AIAgentScheduleResponse = result.object;
    if (config.validateSemantics) {
      const issues = validateScheduleSemantics(schedule);
      if (issues.length) {
        if (config.semanticStrict)
          throw new Error(`Semantic validation failed: ${issues.join("; ")}`);
        const { schedule: salvaged, notes } = salvageSchedule(schedule);
        schedule = notes.length
          ? { ...salvaged, reasoning: `${salvaged.reasoning}\n\n[SemanticSalvage] ${notes.join(" | ")}` }
          : { ...schedule, reasoning: `${schedule.reasoning}\n\n[SemanticWarnings] ${issues.join(" | ")}` };
      }
    }
    return { ...schedule, usage: result.usage };
  }
  catch (error) {
    const repaired = await tryRepairSchedule(error, { jobContext, executionResults, config, model, emit });
    if (repaired) {
      emit({ type: "repairSuccess", phase: "schedule" });
      return repaired;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    const category = classifyScheduleError(errorMessage);
    emit({ type: "malformed", phase: "schedule", category });
    throw new MalformedResponseError({ phase: "schedule", category, attempts: (config.maxRepairAttempts ?? 1), repaired: false, message: `Error in finalizeSchedule [${category}]: ${errorMessage}` });
  }
}

function isRepairableScheduleCategory(cat: string): cat is "semantic_violation" | "schema_parse_error" {
  return cat === "semantic_violation" || cat === "schema_parse_error";
}

async function tryRepairSchedule(originalError: unknown, ctx: ScheduleCoreParams): Promise<AIAgentScheduleResponse | null> {
  if (!ctx.config.repairMalformedResponses)
    return null;
  const errMsg = originalError instanceof Error ? originalError.message : String(originalError);
  const category = classifyScheduleError(errMsg);
  if (!isRepairableScheduleCategory(category))
    return null;
  if (!/Semantic validation failed|Error parsing|schema/i.test(errMsg))
    return null;
  const attempts = Math.max(1, ctx.config.maxRepairAttempts ?? 1);
  for (let i = 0; i < attempts; i++) {
    ctx.emit({ type: "repairAttempt", phase: "schedule" });
    try {
      const rescuePrompt = `${createSchedulingSystemPrompt()}\n\nThe previous response was malformed or semantically invalid (reason: ${errMsg}). Produce a corrected JSON object strictly matching the required schema.`;
      const userPrompt = formatContextForScheduling(ctx.jobContext, ctx.executionResults);
      const result = await generateObject({
        model: ctx.model,
        system: rescuePrompt,
        prompt: userPrompt,
        temperature: 0,
        maxRetries: 1,
        schema: schedulingResponseSchema,
      });
      let schedule: AIAgentScheduleResponse = result.object;
      if (ctx.config.validateSemantics) {
        const issues = validateScheduleSemantics(schedule);
        if (issues.length) {
          if (ctx.config.semanticStrict)
            throw new Error(`Semantic validation failed after repair: ${issues.join("; ")}`);
          const { schedule: salvaged, notes } = salvageSchedule(schedule);
          schedule = notes.length
            ? { ...salvaged, reasoning: `${salvaged.reasoning}\n\n[SemanticSalvage] ${notes.join(" | ")}` }
            : { ...schedule, reasoning: `${schedule.reasoning}\n\n[SemanticWarnings] ${issues.join(" | ")}` };
        }
      }
      return { ...schedule, usage: result.usage };
    }
    catch {
      ctx.emit({ type: "repairFailure", phase: "schedule" });
    }
  }
  return null;
}
