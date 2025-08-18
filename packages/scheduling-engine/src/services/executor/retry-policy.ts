// Retry policy abstractions (scaffold)
export type RetryContext = {
  attempt: number; // 1-based
  maxAttempts: number;
  category: EndpointErrorCategory | null;
  transient: boolean;
  statusCode?: number;
  errorMessage?: string;
};

export type RetryDecision = "retry" | "fail" | "escalate";

export type RetryPolicy = {
  evaluate: (ctx: RetryContext) => RetryDecision;
  nextDelay?: (ctx: RetryContext) => number; // ms
};

// Endpoint error taxonomy (re-exported from errors module once implemented)
export type EndpointErrorCategory =
  | "timeout"
  | "network"
  | "http_4xx"
  | "http_5xx"
  | "aborted"
  | "unknown";

/**
 * Default retry policy: retry transient (timeout/network/5xx) until maxAttempts, else fail.
 * Escalate path reserved for future (e.g., circuit breaker triggering).
 */
export class DefaultRetryPolicy implements RetryPolicy {
  evaluate(ctx: RetryContext): RetryDecision {
    if (ctx.attempt >= ctx.maxAttempts)
      return "fail";

    if (ctx.transient)
      return "retry";

    return "fail";
  }

  nextDelay(ctx: RetryContext): number {
    // simple linear backoff placeholder (replace with exp+jitter later)
    return 250 * ctx.attempt;
  }
}
