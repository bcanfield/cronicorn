/**
 * Prompt & context format helpers shared by plan and schedule cores.
 * Pure string assembly; safe to unit test independently.
 */

import type { ExecutionResults, JobContext } from "../../types.js";

export function createPlanningSystemPrompt(): string {
  return `You are the Cronicorn Scheduling Agent, an intelligent system responsible for planning and optimizing job executions. Your task is to analyze job definitions and determine the optimal execution strategy.`;
}

export function createSchedulingSystemPrompt(): string {
  return `You are the Cronicorn Scheduling Agent, an intelligent system responsible for planning and optimizing job executions. Your task now is to determine the optimal next run time based on execution results.`;
}

export function formatContextForPlanning(jobContext: JobContext): string {
  return `# Current Time\n${jobContext.executionContext?.currentTime}\n\n# Job Definition\n${jobContext.job.definitionNL}\n\n# Available Endpoints\n${formatEndpoints(jobContext.endpoints)}\n\n# Recent History\n${formatMessages(jobContext.messages, 10)}\n\n# Endpoint Usage History\n${formatEndpointUsage(jobContext.endpointUsage, 5)}\n\n# Instructions\nAnalyze the job definition and history to create an execution plan:\n\n1. Determine which endpoints to call based on the job definition and context\n2. Specify parameters and headers for each endpoint call\n3. Set execution priority (order) and identify dependencies between endpoints\n4. Choose between sequential, parallel, or mixed execution strategy\n5. Provide a preliminary estimate for the next run time`;
}

export function formatContextForScheduling(jobContext: JobContext, executionResults: ExecutionResults): string {
  return `# Current Time
${jobContext.executionContext?.currentTime}

# Job Definition
${jobContext.job.definitionNL}

# Execution Results
${formatExecutionResults(executionResults)}

# Recent Message History
${formatMessages(jobContext.messages, 5)}

# Instructions
Based on the job definition and execution results, determine the optimal time for the next execution:

1. Analyze the endpoint responses for timing signals or patterns
2. Consider the job's natural language definition for timing requirements
3. Determine the most appropriate next execution time
4. Provide detailed reasoning for your scheduling decision
5. Recommend any additional actions if necessary`;
}

export function formatEndpoints(endpoints: JobContext["endpoints"]): string {
  return endpoints.map((e) => {
    const schema = e.requestSchema ? `\nSchema: ${e.requestSchema}` : "";
    return `- ID: ${e.id}\n  Name: ${e.name}\n  URL: ${e.url}\n  Method: ${e.method}${schema}\n  Timeout: ${e.timeoutMs}ms`;
  }).join("\n\n");
}

export function formatMessages(messages: JobContext["messages"], limit: number): string {
  return messages.slice(-limit).map((m) => {
    const timestamp = m.timestamp;
    return `[${m.role}] ${timestamp}\n${formatContent(m.content)}`;
  }).join("\n\n");
}

export function formatContent(content: string | unknown[]): string {
  if (typeof content === "string") {
    return content;
  }
  return JSON.stringify(content);
}

export function formatEndpointUsage(usage: JobContext["endpointUsage"], limit: number): string {
  return usage.slice(-limit).map((u) => {
    const status = u.success ? "SUCCESS" : "FAILURE";
    const timestamp = u.timestamp;
    const error = u.errorMessage ? `\n  Error: ${u.errorMessage}` : "";
    return `- ${u.endpointId} (${timestamp})\n  Status: ${status} (${u.statusCode})\n  Duration: ${u.executionTimeMs}ms${error}`;
  }).join("\n\n");
}

export function formatExecutionResults(results: ExecutionResults): string {
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
