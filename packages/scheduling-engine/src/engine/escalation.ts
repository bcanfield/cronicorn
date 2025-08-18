import type { ExecutionConfig } from "../config.js";

export type EscalationLevel = "none" | "warn" | "critical";
export type RecoveryAction = "NONE" | "BACKOFF_ONLY" | "REDUCE_CONCURRENCY" | "DISABLE_ENDPOINT";

export type EscalationInput = {
  failures: number;
  attempted: number;
  executionConfig: ExecutionConfig;
  previousLevel: EscalationLevel;
  failedEndpointIds: string[];
  existingDisabled?: Set<string>;
};

export type EscalationResult = {
  level: EscalationLevel;
  recoveryAction: RecoveryAction;
  disabledEndpoints?: string[];
  levelChanged: boolean;
};

export function computeEscalation(input: EscalationInput): EscalationResult {
  const { failures, attempted, executionConfig, previousLevel, failedEndpointIds, existingDisabled } = input;
  const attemptedSafe = attempted || 1;
  const ratio = failures / attemptedSafe;
  const warnRatio = executionConfig.escalation?.warnFailureRatio ?? 0.25;
  const criticalRatio = executionConfig.escalation?.criticalFailureRatio ?? 0.5;
  const level: EscalationLevel = ratio >= criticalRatio ? "critical" : ratio >= warnRatio ? "warn" : "none";
  let recoveryAction: RecoveryAction = "NONE";
  if (level === "warn")
    recoveryAction = "BACKOFF_ONLY";
  else if (level === "critical")
    recoveryAction = "DISABLE_ENDPOINT";
  let disabledEndpoints: string[] | undefined;
  if (recoveryAction === "DISABLE_ENDPOINT") {
    const aggregate = existingDisabled ? new Set(existingDisabled) : new Set<string>();
    for (const id of failedEndpointIds) aggregate.add(id);
    if (aggregate.size > 0)
      disabledEndpoints = Array.from(aggregate);
  }
  return { level, recoveryAction, disabledEndpoints, levelChanged: level !== previousLevel && (level === "warn" || level === "critical" || previousLevel !== "none") };
}
