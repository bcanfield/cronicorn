// Retry policy abstractions (scaffold)
export type RetryContext = {
    attempt: number; // 1-based
    maxAttempts: number;
    category: EndpointErrorCategory | null;
    transient: boolean;
    statusCode?: number;
    errorMessage?: string;
    consecutiveFailures?: number; // across cycles
    warnThresholdAttempt?: number; // attempt number at which warn escalation would trigger
    criticalThresholdAttempt?: number; // attempt number for critical escalation
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
        // Immediate aborts / non-retryable
        if (ctx.category === "aborted")
            return "fail";

        // Non-retryable 4xx except 408/429
        if (ctx.category === "http_4xx") {
            if (ctx.statusCode && (ctx.statusCode === 408 || ctx.statusCode === 429)) {
                // treat as transient with backoff
            }
            else {
                return "fail";
            }
        }

        // Transient categories
        const isTransient = ctx.transient || ctx.category === "timeout" || ctx.category === "network" || ctx.category === "http_5xx" || (ctx.category === "http_4xx" && (ctx.statusCode === 408 || ctx.statusCode === 429));

        // Escalation thresholds: if we have reached critical threshold, escalate (stop early)
        if (ctx.criticalThresholdAttempt && ctx.attempt >= ctx.criticalThresholdAttempt && isTransient) {
            return "escalate";
        }
        // If reached max attempts
        if (ctx.attempt >= ctx.maxAttempts)
            return "fail";

        if (isTransient)
            return "retry";

        return "fail";
    }

    nextDelay(ctx: RetryContext): number {
        // base linear backoff
        let delay = 250 * ctx.attempt;
        // Increase for HTTP 429 (rate limit) exponentially
        if (ctx.statusCode === 429) {
            delay = Math.min(5000, 500 * (2 ** (ctx.attempt - 1)));
        }
        // Escalation multipliers
        if (ctx.warnThresholdAttempt && ctx.attempt >= ctx.warnThresholdAttempt) {
            delay *= 2;
        }
        if (ctx.criticalThresholdAttempt && ctx.attempt >= ctx.criticalThresholdAttempt) {
            delay *= 2; // total 4x once critical
        }
        return delay;
    }
}
