import { generateObject, type LanguageModel } from "ai";

import type { AIAgentConfig } from "../../config.js";
import type { JobContext } from "../../types.js";
import type { AIAgentMetricsEvent, AIAgentPlanResponse } from "./types.js";

import { classifyPlanError } from "./classification.js";
import { createPlanningSystemPrompt, formatContextForPlanning } from "./formatting.js";
import { optimizeJobContext } from "./prompt-optimization.js";
import { executionPlanSchema } from "./schemas.js";
import { salvagePlan, validatePlanSemantics } from "./semantics.js";

/**
 * Core planning logic: builds execution plan via LLM, performs semantic validation
 * and single-pass repair. Pure (side-effect free except model call + emit).
 */

export type PlanCoreParams = {
  jobContext: JobContext;
  config: AIAgentConfig;
  model: LanguageModel;
  emit: (e: AIAgentMetricsEvent) => void;
};

export async function planExecutionCore({ jobContext, config, model, emit }: PlanCoreParams): Promise<AIAgentPlanResponse> {
  try {
    const optimized = optimizeJobContext(jobContext, config.promptOptimization);
    const systemPrompt = createPlanningSystemPrompt();
    const userPrompt = formatContextForPlanning(optimized);
    const result = await generateObject({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: config.temperature ?? 0.2,
      maxRetries: config.maxRetries ?? 2,
      schema: executionPlanSchema,
    });
    let plan: AIAgentPlanResponse = result.object;
    if (config.validateSemantics) {
      const issues = validatePlanSemantics(plan);
      if (issues.length) {
        if (config.semanticStrict)
          throw new Error(`Semantic validation failed: ${issues.join("; ")}`);
        // attempt salvage (non-strict)
        const { plan: salvaged, notes } = salvagePlan(plan);
        if (notes.length)
          plan = { ...salvaged, reasoning: `${salvaged.reasoning}\n\n[SemanticSalvage] ${notes.join(" | ")}` };
        else
          plan = { ...plan, reasoning: `${plan.reasoning}\n\n[SemanticWarnings] ${issues.join(" | ")}` };
      }
    }
    return { ...plan, usage: result.usage };
  }
  catch (error) {
    const repaired = await tryRepairPlan(error, { jobContext, config, model, emit });
    if (repaired) {
      emit({ type: "repairSuccess", phase: "plan" });
      return repaired;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    const category = classifyPlanError(errorMessage);
    emit({ type: "malformed", phase: "plan", category });
    throw new Error(`Error in planExecution [${category}]: ${errorMessage}`);
  }
}

function isRepairablePlanCategory(cat: string): cat is "semantic_violation" | "schema_parse_error" {
  return cat === "semantic_violation" || cat === "schema_parse_error";
}

async function tryRepairPlan(originalError: unknown, ctx: PlanCoreParams): Promise<AIAgentPlanResponse | null> {
  if (!ctx.config.repairMalformedResponses)
    return null;
  const errMsg = originalError instanceof Error ? originalError.message : String(originalError);
  const category = classifyPlanError(errMsg);
  if (!isRepairablePlanCategory(category))
    return null;
  if (!/Semantic validation failed|Error parsing|schema/i.test(errMsg))
    return null;
  const attempts = Math.max(1, ctx.config.maxRepairAttempts ?? 1);
  for (let i = 0; i < attempts; i++) {
    ctx.emit({ type: "repairAttempt", phase: "plan" });
    try {
      const optimized = optimizeJobContext(ctx.jobContext, ctx.config.promptOptimization);
      const rescuePrompt = `${createPlanningSystemPrompt()}\n\nThe previous response was malformed or semantically invalid (reason: ${errMsg}). Produce a corrected JSON object strictly matching the required schema.`;
      const userPrompt = formatContextForPlanning(optimized);
      const result = await generateObject({
        model: ctx.model,
        system: rescuePrompt,
        prompt: userPrompt,
        temperature: 0,
        maxRetries: 1,
        schema: executionPlanSchema,
      });
      let plan: AIAgentPlanResponse = result.object;
      if (ctx.config.validateSemantics) {
        const issues = validatePlanSemantics(plan);
        if (issues.length) {
          if (ctx.config.semanticStrict)
            throw new Error(`Semantic validation failed after repair: ${issues.join("; ")}`);
          const { plan: salvaged, notes } = salvagePlan(plan);
          plan = notes.length
            ? { ...salvaged, reasoning: `${salvaged.reasoning}\n\n[SemanticSalvage] ${notes.join(" | ")}` }
            : { ...plan, reasoning: `${plan.reasoning}\n\n[SemanticWarnings] ${issues.join(" | ")}` };
        }
      }
      return { ...plan, usage: result.usage };
    }
    catch {
      ctx.emit({ type: "repairFailure", phase: "plan" });
      // continue loop
    }
  }
  return null;
}
