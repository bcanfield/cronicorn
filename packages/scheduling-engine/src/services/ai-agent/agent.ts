import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import type { AIAgentConfig } from "../../config.js";
/**
 * AI Agent service interface and implementation
 */
import type { ExecutionResults, JobContext } from "../../types.js";

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
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
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
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
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
  constructor(config: AIAgentConfig) {
    this.config = config;
    this.model = openai(config.model);
  }

  /**
   * Plan execution of a job
   *
   * @param jobContext Context of the job
   * @returns Execution plan
   */
  async planExecution(jobContext: JobContext): Promise<AIAgentPlanResponse> {
    try {
      // Format system prompt
      const systemPrompt = this.createPlanningSystemPrompt();

      // Format user prompt with context
      const userPrompt = this.formatContextForPlanning(jobContext);

      // Use Vercel AI SDK to generate object with structured output

      const result = await generateObject({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: this.config.temperature ?? 0.2,
        maxRetries: this.config.maxRetries ?? 2,
        schema: executionPlanSchema,
      });

      return { ...result.object, usage: result.usage };
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
      // Format system prompt
      const systemPrompt = this.createSchedulingSystemPrompt();

      // Format user prompt with context and execution results
      const userPrompt = this.formatContextForScheduling(jobContext, executionResults);

      // Use Vercel AI SDK to generate text with structured output
      const result = await generateObject({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: this.config.temperature ?? 0.2,
        maxRetries: this.config.maxRetries ?? 2,
        schema: schedulingResponseSchema,
      });

      return { ...result.object, usage: result.usage };
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
    return `# Current Time
${jobContext.executionContext?.currentTime}

# Job Definition
${jobContext.job.definitionNL}

# Available Endpoints
${this.formatEndpoints(jobContext.endpoints)}

# Recent History
${this.formatMessages(jobContext.messages, 10)}

# Endpoint Usage History
${this.formatEndpointUsage(jobContext.endpointUsage, 5)}

# Instructions
Analyze the job definition and history to create an execution plan:

1. Determine which endpoints to call based on the job definition and context
2. Specify parameters and headers for each endpoint call
3. Set execution priority (order) and identify dependencies between endpoints
4. Choose between sequential, parallel, or mixed execution strategy
5. Provide a preliminary estimate for the next run time`;
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
}
