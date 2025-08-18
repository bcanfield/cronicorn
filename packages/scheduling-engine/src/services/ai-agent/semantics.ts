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
        if (!ids.has(dep)) issues.push(`Endpoint ${ep.endpointId} depends on unknown endpoint ${dep}`);
        if (dep === ep.endpointId) issues.push(`Endpoint ${ep.endpointId} has self-dependency`);
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
  } else if (Date.parse(schedule.nextRunAt) <= Date.now()) {
    issues.push("nextRunAt is not in the future");
  }
  if (schedule.confidence < 0.0 || schedule.confidence > 1.0) {
    issues.push("confidence outside 0-1 range");
  }
  return issues;
}

/**
 * Salvage helpers (non-strict mode only): attempt to coerce / trim invalid structures so that
 * downstream execution can proceed with a degraded but safe plan/schedule. All adjustments
 * are annotated via returned notes which the caller should append to reasoning.
 */
export function salvagePlan(plan: AIAgentPlanResponse): { plan: AIAgentPlanResponse; notes: string[] } {
  const notes: string[] = [];
  let changed = false;
  // Ensure concurrencyLimit valid for parallel strategy
  if (plan.executionStrategy === "parallel" && (plan.concurrencyLimit ?? 0) < 2) {
    plan = { ...plan, concurrencyLimit: 2 };
    notes.push("Adjusted concurrencyLimit to 2 for parallel strategy");
    changed = true;
  }
  const ids = new Set(plan.endpointsToCall.map(e => e.endpointId));
  const newEndpoints = plan.endpointsToCall.map(ep => {
    let epChanged = false;
    const dependsOn = ep.dependsOn ? ep.dependsOn.filter(d => ids.has(d) && d !== ep.endpointId) : ep.dependsOn;
    if (ep.dependsOn && JSON.stringify(dependsOn) !== JSON.stringify(ep.dependsOn)) {
      notes.push(`Cleaned dependencies for ${ep.endpointId}`);
      epChanged = true;
    }
    let priority = ep.priority;
    if (ep.critical && (priority === undefined || priority < 1)) {
      priority = 1;
      notes.push(`Elevated priority of critical endpoint ${ep.endpointId} to 1`);
      epChanged = true;
    }
    if (epChanged) {
      changed = true;
      return { ...ep, dependsOn, priority };
    }
    return ep;
  });
  if (changed) {
    plan = { ...plan, endpointsToCall: newEndpoints };
  }
  return { plan, notes };
}

export function salvageSchedule(schedule: AIAgentScheduleResponse): { schedule: AIAgentScheduleResponse; notes: string[] } {
  const notes: string[] = [];
  // Fix nextRunAt
  const parsed = Date.parse(schedule.nextRunAt);
  if (Number.isNaN(parsed) || parsed <= Date.now()) {
    const newTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    schedule = { ...schedule, nextRunAt: newTime };
    notes.push("Replaced invalid/past nextRunAt with +1h fallback");
  }
  if (schedule.confidence < 0 || schedule.confidence > 1) {
    const clamped = Math.min(1, Math.max(0, schedule.confidence));
    schedule = { ...schedule, confidence: clamped };
    notes.push("Clamped confidence into [0,1] range");
  }
  return { schedule, notes };
}
