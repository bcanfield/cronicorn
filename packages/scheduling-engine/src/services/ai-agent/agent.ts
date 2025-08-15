import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import type { ExecutionResults, JobContext } from "../../types.js";

import { type AIAgentConfig, AIAgentConfigSchema } from "../../config.js";
import { optimizeJobContext } from "./prompt-optimization.js";

/**
 * Token usage information
 */
export type TokenUsage = {
  /** Number of input tokens */
  inputTokens?: number;

  /** Number of output tokens */
  outputTokens?: number;

  /** Total number of tokens */
  totalTokens?: number;

  /** Number of tokens used for reasoning */
  reasoningTokens?: number;

  /** Number of cached input tokens */
  cachedInputTokens?: number;
};

/**
 * Planning phase response from the AI agent
 */
export type AIAgentPlanResponse = {
  /** Endpoints that should be called */
  endpointsToCall: Array<{
    /** ID of the endpoint to call */
    endpointId: string;

    /** Request parameters (body or query) */
    parameters?: Record<string, any>;

    /** Additional headers to send */
    headers?: Record<string, string>;

    /** Priority (lower number = higher priority) */
    priority: number;

    /** IDs of endpoints that must complete first */
    dependsOn?: string[];

    /** Whether failure should stop further execution */
    critical: boolean;
  }>;

  /** Execution strategy */
  executionStrategy: "sequential" | "parallel" | "mixed";

  /** Maximum parallel executions */
  concurrencyLimit?: number;

  /** Initial estimate for next run */
  preliminaryNextRunAt?: string;

  /** Detailed explanation of decisions */
  reasoning: string;

  /** Confidence in the plan (0.0 to 1.0) */
  confidence: number;

  /** token usage (optional) */
  usage?: TokenUsage;
};

/**
 * Scheduling phase response from the AI agent
 */
export type AIAgentScheduleResponse = {
  /** Next execution time */
  nextRunAt: string;

  /** Detailed explanation of scheduling decision */
  reasoning: string;

  /** Confidence in the decision (0.0 to 1.0) */
  confidence: number;

  /** Recommended actions */
  recommendedActions?: Array<{
    /** Type of action */
    type: "retry_failed_endpoints" | "pause_job" | "modify_frequency" | "notify_user" | "adjust_timeout";

    /** Explanation of the recommendation */
    details: string;

    /** Urgency of the action */
    priority: "low" | "medium" | "high";
  }>;

  /** token usage (optional) */
  usage?: TokenUsage;
};

/**
 * AI Agent service interface
 */
export type AIAgentService = {
  /**
   * Plan execution of a job
   *
   * @param jobContext Context of the job
   * @returns Execution plan
   */
  planExecution: (jobContext: JobContext) => Promise<AIAgentPlanResponse>;

  /**
   * Finalize schedule after execution
   *
   * @param jobContext Context of the job
   * @param executionResults Results of endpoint execution
   * @returns Scheduling decision
   */
  finalizeSchedule: (
    jobContext: JobContext,
    executionResults: ExecutionResults
  ) => Promise<AIAgentScheduleResponse>;
};

/**
 * Schema for execution plan validation
 */
const executionPlanSchema = z.object({
  endpointsToCall: z.array(
    z.object({
      endpointId: z.string(),
      parameters: z.record(z.unknown()).optional(),
      headers: z.record(z.string()).optional(),
      priority: z.number(),
      dependsOn: z.array(z.string()).optional(),
      critical: z.boolean(),
    }),
  ),
  executionStrategy: z.enum(["sequential", "parallel", "mixed"]),
  concurrencyLimit: z.number().optional(),
  preliminaryNextRunAt: z.string().optional(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

/**
 * Schema for scheduling response validation
 */
const schedulingResponseSchema = z.object({
  nextRunAt: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  recommendedActions: z.array(
    z.object({
      type: z.enum([
        "retry_failed_endpoints",
        "pause_job",
        "modify_frequency",
        "notify_user",
        "adjust_timeout",
      ]),
      details: z.string(),
      priority: z.enum(["low", "medium", "high"]),
    }),
  ).optional(),
});

/**
 * Default AI Agent service implementation using Vercel AI SDK
 */
export class DefaultAIAgentService implements AIAgentService {
  private config: AIAgentConfig;
  private model: ReturnType<typeof openai>;

  /**
   * Create a new AI agent service
   *
   * @param config AI agent configuration
   */
  constructor(config: Partial<AIAgentConfig>) {
    this.config = AIAgentConfigSchema.parse(config || {});
    this.model = openai(this.config.model);
  }

  /**
   * Plan execution of a job
   *
   * @param jobContext Context of the job
   * @returns Execution plan
   */
  async planExecution(jobContext: JobContext): Promise<AIAgentPlanResponse> {
    try {
      const optimized = this.optimizeContext(jobContext);
      const systemPrompt = this.createPlanningSystemPrompt();
      const userPrompt = this.formatContextForPlanning(optimized);
      const result = await generateObject({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: this.config.temperature ?? 0.2,
        maxRetries: this.config.maxRetries ?? 2,
        schema: executionPlanSchema,
      });
      let object = result.object;
      if (this.config.validateSemantics) {
        const issues = this.validatePlanSemantics(object);
        if (issues.length) {
          if (this.config.semanticStrict) {
            throw new Error(`Semantic validation failed: ${issues.join("; ")}`);
          }
          else {
            // append warning into reasoning for traceability
            object = { ...object, reasoning: `${object.reasoning}\n\n[SemanticWarnings] ${issues.join(" | ")}` } as any;
          }
        }
      }
      return { ...object, usage: result.usage };
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error in planExecution: ${errorMessage}`);
    }
  }

  /**
   * Finalize schedule after execution
   *
   * @param jobContext Context of the job
   * @param executionResults Results of endpoint execution
   * @returns Scheduling decision
   */
  async finalizeSchedule(
    jobContext: JobContext,
    executionResults: ExecutionResults,
  ): Promise<AIAgentScheduleResponse> {
    try {
      const systemPrompt = this.createSchedulingSystemPrompt();
      const userPrompt = this.formatContextForScheduling(jobContext, executionResults);
      const result = await generateObject({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: this.config.temperature ?? 0.2,
        maxRetries: this.config.maxRetries ?? 2,
        schema: schedulingResponseSchema,
      });
      let object = result.object;
      if (this.config.validateSemantics) {
        const issues = this.validateScheduleSemantics(object);
        if (issues.length) {
          if (this.config.semanticStrict) {
            throw new Error(`Semantic validation failed: ${issues.join("; ")}`);
          }
          else {
            object = { ...object, reasoning: `${object.reasoning}\n\n[SemanticWarnings] ${issues.join(" | ")}` } as any;
          }
        }
      }
      return { ...object, usage: result.usage };
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error in finalizeSchedule: ${errorMessage}`);
    }
  }

  /**
   * Create system prompt for planning phase
   *
   * @returns System prompt text
   */
  private createPlanningSystemPrompt(): string {
    return `You are the Cronicorn Scheduling Agent, an intelligent system responsible for planning and optimizing job executions. Your task is to analyze job definitions and determine the optimal execution strategy.`;
  }

  /**
   * Create system prompt for scheduling phase
   *
   * @returns System prompt text
   */
  private createSchedulingSystemPrompt(): string {
    return `You are the Cronicorn Scheduling Agent, an intelligent system responsible for planning and optimizing job executions. Your task now is to determine the optimal next run time based on execution results.`;
  }

  /**
   * Format job context for planning phase
   *
   * @param jobContext Job context
   * @returns Formatted context for prompt
   */
  private formatContextForPlanning(jobContext: JobContext): string {
    return `# Current Time\n${jobContext.executionContext?.currentTime}\n\n# Job Definition\n${jobContext.job.definitionNL}\n\n# Available Endpoints\n${this.formatEndpoints(jobContext.endpoints)}\n\n# Recent History\n${this.formatMessages(jobContext.messages, 10)}\n\n# Endpoint Usage History\n${this.formatEndpointUsage(jobContext.endpointUsage, 5)}\n\n# Instructions\nAnalyze the job definition and history to create an execution plan:\n\n1. Determine which endpoints to call based on the job definition and context\n2. Specify parameters and headers for each endpoint call\n3. Set execution priority (order) and identify dependencies between endpoints\n4. Choose between sequential, parallel, or mixed execution strategy\n5. Provide a preliminary estimate for the next run time`;
  }

  /**
   * Format job context for scheduling phase
   *
   * @param jobContext Job context
   * @param executionResults Execution results
   * @returns Formatted context for prompt
   */
  private formatContextForScheduling(jobContext: JobContext, executionResults: ExecutionResults): string {
    return `# Current Time
${jobContext.executionContext?.currentTime}

# Job Definition
${jobContext.job.definitionNL}

# Execution Results
${this.formatExecutionResults(executionResults)}

# Recent Message History
${this.formatMessages(jobContext.messages, 5)}

# Instructions
Based on the job definition and execution results, determine the optimal time for the next execution:

1. Analyze the endpoint responses for timing signals or patterns
2. Consider the job's natural language definition for timing requirements
3. Determine the most appropriate next execution time
4. Provide detailed reasoning for your scheduling decision
5. Recommend any additional actions if necessary`;
  }

  /**
   * Format endpoints for prompt
   *
   * @param endpoints Endpoint list
   * @returns Formatted endpoints text
   */
  private formatEndpoints(endpoints: JobContext["endpoints"]): string {
    return endpoints.map((e) => {
      const schema = e.requestSchema ? `\nSchema: ${e.requestSchema}` : "";
      return `- ID: ${e.id}\n  Name: ${e.name}\n  URL: ${e.url}\n  Method: ${e.method}${schema}\n  Timeout: ${e.timeoutMs}ms`;
    }).join("\n\n");
  }

  /**
   * Format messages for prompt
   *
   * @param messages Message list
   * @param limit Maximum number of messages
   * @returns Formatted messages text
   */
  private formatMessages(messages: JobContext["messages"], limit: number): string {
    return messages.slice(-limit).map((m) => {
      const timestamp = m.timestamp;
      return `[${m.role}] ${timestamp}\n${this.formatContent(m.content)}`;
    }).join("\n\n");
  }

  /**
   * Format message content
   *
   * @param content Message content
   * @returns Formatted content text
   */
  private formatContent(content: string | any[]): string {
    if (typeof content === "string") {
      return content;
    }

    return JSON.stringify(content);
  }

  /**
   * Format endpoint usage history
   *
   * @param usage Usage history
   * @param limit Maximum entries
   * @returns Formatted usage text
   */
  private formatEndpointUsage(usage: JobContext["endpointUsage"], limit: number): string {
    return usage.slice(-limit).map((u) => {
      const status = u.success ? "SUCCESS" : "FAILURE";
      const timestamp = u.timestamp;
      const error = u.errorMessage ? `\n  Error: ${u.errorMessage}` : "";

      return `- ${u.endpointId} (${timestamp})\n  Status: ${status} (${u.statusCode})\n  Duration: ${u.executionTimeMs}ms${error}`;
    }).join("\n\n");
  }

  /**
   * Format execution results
   *
   * @param results Execution results
   * @returns Formatted results text
   */
  private formatExecutionResults(results: ExecutionResults): string {
    return `Execution Summary:
Start Time: ${results.summary.startTime}
End Time: ${results.summary.endTime}
Total Duration: ${results.summary.totalDurationMs}ms
Success: ${results.summary.successCount}
Failures: ${results.summary.failureCount}

Endpoint Results:
${results.results.map((r) => {
      const status = r.success ? "SUCCESS" : "FAILURE";
      const response = r.responseContent ? `\n  Response: ${JSON.stringify(r.responseContent).substring(0, 200)}${r.truncated ? "... (truncated)" : ""}` : "";
      const error = r.error ? `\n  Error: ${r.error}` : "";

      return `- ${r.endpointId} (${r.timestamp})\n  Status: ${status} (${r.statusCode})\n  Duration: ${r.executionTimeMs}ms${response}${error}`;
    }).join("\n\n")}`;
  }

  /**
   * Optimize context for prompt based on configuration
   *
   * @param jobContext Job context
   * @returns Optimized job context
   */
  private optimizeContext(jobContext: JobContext): JobContext {
    return optimizeJobContext(jobContext, this.config.promptOptimization);
  }

  private validatePlanSemantics(plan: AIAgentPlanResponse): string[] {
    const issues: string[] = [];
    // concurrency strategy consistency
    if (plan.executionStrategy === "parallel" && plan.concurrencyLimit && plan.concurrencyLimit < 2) {
      issues.push("Parallel strategy requires concurrencyLimit >= 2");
    }
    // dependency existence & cycles
    const ids = new Set(plan.endpointsToCall.map(e => e.endpointId));
    for (const ep of plan.endpointsToCall) {
      if (ep.dependsOn) {
        for (const dep of ep.dependsOn) {
          if (!ids.has(dep))
            issues.push(`Endpoint ${ep.endpointId} depends on unknown endpoint ${dep}`);
          if (dep === ep.endpointId)
            issues.push(`Endpoint ${ep.endpointId} has self-dependency`);
        }
      }
    }
    // critical endpoints must have priority defined (already required) and priority >=1
    for (const ep of plan.endpointsToCall) {
      if (ep.critical && (ep.priority === undefined || ep.priority < 1)) {
        issues.push(`Critical endpoint ${ep.endpointId} must have priority >=1`);
      }
    }
    return issues;
  }

  private validateScheduleSemantics(schedule: AIAgentScheduleResponse): string[] {
    const issues: string[] = [];
    // nextRunAt should be in the future
    if (Number.isNaN(Date.parse(schedule.nextRunAt))) {
      issues.push("nextRunAt is not a valid date");
    }
    else if (Date.parse(schedule.nextRunAt) <= Date.now()) {
      issues.push("nextRunAt is not in the future");
    }
    // confidence sanity
    if (schedule.confidence < 0.0 || schedule.confidence > 1.0) {
      issues.push("confidence outside 0-1 range");
    }
    return issues;
  }
}
