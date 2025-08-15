import type { AIAgentPlanResponse, AIAgentScheduleResponse } from "./types.js";

/**
 * Semantic validators for plan & schedule responses.
 * Return arrays of human-readable issue strings (no throwing inside).
 */

export function validatePlanSemantics(plan: AIAgentPlanResponse): string[] {
  const issues: string[] = [];
  if (plan.executionStrategy === "parallel" && plan.concurrencyLimit && plan.concurrencyLimit < 2) {
    issues.push("Parallel strategy requires concurrencyLimit >= 2");
  }
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
  for (const ep of plan.endpointsToCall) {
    if (ep.critical && (ep.priority === undefined || ep.priority < 1)) {
      issues.push(`Critical endpoint ${ep.endpointId} must have priority >=1`);
    }
  }
  return issues;
}

export function validateScheduleSemantics(schedule: AIAgentScheduleResponse): string[] {
  const issues: string[] = [];
  if (Number.isNaN(Date.parse(schedule.nextRunAt))) {
    issues.push("nextRunAt is not a valid date");
  }
  else if (Date.parse(schedule.nextRunAt) <= Date.now()) {
    issues.push("nextRunAt is not in the future");
  }
  if (schedule.confidence < 0.0 || schedule.confidence > 1.0) {
    issues.push("confidence outside 0-1 range");
  }
  return issues;
}
