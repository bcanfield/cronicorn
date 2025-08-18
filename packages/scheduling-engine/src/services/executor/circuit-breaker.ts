// Circuit breaker implementation (scaffold)
import type { ExecutionConfig } from "../../config.js";

export type CircuitState = "closed" | "open" | "half_open";

export type CircuitBreakerSnapshot = {
  state: CircuitState;
  failures: number;
  lastFailureAt?: number;
  openedAt?: number;
  halfOpenTrialCalls: number;
  halfOpenSuccesses: number;
};

export class EndpointCircuitBreaker {
  private config: ExecutionConfig["circuitBreaker"];
  private map = new Map<string, CircuitBreakerSnapshot>();
  private now(): number { return Date.now(); }

  constructor(execConfig: ExecutionConfig) {
    this.config = execConfig.circuitBreaker;
  }

  getState(endpointId: string): CircuitBreakerSnapshot {
    const existing = this.map.get(endpointId);
    if (existing)
      return existing;
    const snapshot: CircuitBreakerSnapshot = { state: "closed", failures: 0, halfOpenTrialCalls: 0, halfOpenSuccesses: 0 };
    this.map.set(endpointId, snapshot);
    return snapshot;
  }

  shouldAllow(endpointId: string): boolean {
    if (!this.config.enabled)
      return true;
    const snap = this.getState(endpointId);
    if (snap.state === "open") {
      // check cooldown
      if (snap.openedAt && this.now() - snap.openedAt >= this.config.cooldownMs) {
        snap.state = "half_open";
        snap.halfOpenTrialCalls = 0;
        snap.halfOpenSuccesses = 0;
        return true; // allow trial
      }
      return false;
    }
    if (snap.state === "half_open") {
      if (snap.halfOpenTrialCalls >= this.config.halfOpenMaxCalls)
        return false; // limit concurrent trials
      return true;
    }
    return true; // closed
  }

  recordSuccess(endpointId: string): CircuitState {
    if (!this.config.enabled)
      return "closed";
    const snap = this.getState(endpointId);
    if (snap.state === "half_open") {
      snap.halfOpenTrialCalls++;
      snap.halfOpenSuccesses++;
      if (snap.halfOpenSuccesses >= this.config.halfOpenSuccessesToClose) {
        snap.state = "closed";
        snap.failures = 0;
        snap.openedAt = undefined;
      }
      return snap.state;
    }
    // closed: reset failure window if outside time window
    this.maybeResetWindow(snap);
    return snap.state;
  }

  recordFailure(endpointId: string): CircuitState {
    if (!this.config.enabled)
      return "closed";
    const snap = this.getState(endpointId);
    const now = this.now();
    if (snap.state === "half_open") {
      // immediate re-open on failure in half-open
      snap.state = "open";
      snap.openedAt = now;
      snap.failures = this.config.failureThreshold; // saturate
      return snap.state;
    }
    this.maybeResetWindow(snap);
    snap.failures++;
    snap.lastFailureAt = now;
    if (snap.failures >= this.config.failureThreshold) {
      snap.state = "open";
      snap.openedAt = now;
    }
    return snap.state;
  }

  private maybeResetWindow(snap: CircuitBreakerSnapshot): void {
    if (!snap.lastFailureAt)
      return;
    if (this.now() - snap.lastFailureAt > this.config.windowMs) {
      snap.failures = 0;
      snap.lastFailureAt = undefined;
    }
  }
}
