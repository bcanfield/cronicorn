import type { PromptOptimizationConfig } from "../../config.js";
import type { JobContext } from "../../types.js";

/** Optimized context result */
export type OptimizedContextResult = {
  before: JobContext;
  after: JobContext;
};

/** Report describing prompt optimization impact */
export type PromptOptimizationReport = {
  messagesBefore: number;
  messagesAfter: number;
  endpointUsageBefore: number;
  endpointUsageAfter: number;
  tokenEstimateBefore: number;
  tokenEstimateAfter: number;
  reduction: {
    messages: number; // absolute reduction
    endpointUsage: number; // absolute reduction
    tokenEstimate: number; // absolute reduction
    tokenPercent: number; // % reduction (0-100)
  };
  systemMessagesPreserved: boolean;
  minRecentSatisfied: boolean;
  config: PromptOptimizationConfig | undefined;
};

/**
 * Optimize the job context (messages + endpoint usage) based on prompt optimization config.
 * Extracted from DefaultAIAgentService to allow isolated testing.
 */
export function optimizeJobContext(jobContext: JobContext, cfg?: PromptOptimizationConfig): JobContext {
  if (!cfg || cfg.enabled === false)
    return jobContext;

  const maxMessages = cfg.maxMessages ?? 10;
  const minRecent = cfg.minRecentMessages ?? 3;
  const usageLimit = cfg.maxEndpointUsageEntries ?? 5;

  const messages = jobContext.messages;
  const systemMessages = messages.filter(m => m.role === "system");
  const recentNonSystem = messages.filter(m => m.role !== "system").slice(-Math.max(minRecent, maxMessages));
  const optimizedMessages = [...systemMessages, ...recentNonSystem].slice(-maxMessages);
  const optimizedUsage = jobContext.endpointUsage.slice(-usageLimit);

  return { ...jobContext, messages: optimizedMessages, endpointUsage: optimizedUsage };
}

/** Rough token estimate based on simple heuristics (character length / 4 + structural weight). */
function estimateTokens(jobContext: JobContext): number {
  const messageChars = jobContext.messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
  const endpointWeight = jobContext.endpoints.length * 12; // structural overhead per endpoint
  const usageWeight = jobContext.endpointUsage.length * 8; // small cost per usage entry
  const definitionChars = jobContext.job.definitionNL.length;
  return Math.ceil((messageChars + definitionChars) / 4) + endpointWeight + usageWeight;
}

/**
 * Analyze optimization impact returning a report object used in tests & future regression guards.
 */
export function analyzePromptOptimization(jobContext: JobContext, cfg?: PromptOptimizationConfig) {
  const beforeTokens = estimateTokens(jobContext);
  const optimized = optimizeJobContext(jobContext, cfg);
  const afterTokens = estimateTokens(optimized);

  // Determine system message preservation (all system messages present after optimization)
  const beforeSystemIds = new Set(jobContext.messages.filter(m => m.role === "system").map(m => m.id));
  const afterSystemIds = new Set(optimized.messages.filter(m => m.role === "system").map(m => m.id));
  const systemMessagesPreserved = Array.from(beforeSystemIds).every(id => afterSystemIds.has(id));

  // Determine min recent satisfied: count of non-system after >= configured minRecentMessages (if cfg provided)
  const nonSystemAfter = optimized.messages.filter(m => m.role !== "system").length;
  const minRecentSatisfied = cfg ? nonSystemAfter >= (cfg.minRecentMessages ?? 3) : true;

  return {
    messagesBefore: jobContext.messages.length,
    messagesAfter: optimized.messages.length,
    endpointUsageBefore: jobContext.endpointUsage.length,
    endpointUsageAfter: optimized.endpointUsage.length,
    tokenEstimateBefore: beforeTokens,
    tokenEstimateAfter: afterTokens,
    reduction: {
      messages: jobContext.messages.length - optimized.messages.length,
      endpointUsage: jobContext.endpointUsage.length - optimized.endpointUsage.length,
      tokenEstimate: beforeTokens - afterTokens,
      tokenPercent: beforeTokens > 0 ? ((beforeTokens - afterTokens) / beforeTokens) * 100 : 0,
    },
    systemMessagesPreserved,
    minRecentSatisfied,
    config: cfg,
  };
}
