// src/config/planLimits.ts

export type Plan = "free" | "pro" | "enterprise";

export interface PlanLimits {
	/** How many distinct cron schedules a user can create */
	schedules: number;
	/** How many total executions (invocations) per month */
	executions: number;
	/** How many OpenAI tokens per month */
	tokenLimit: number;
	/** Max execution time per job (in seconds) */
	maxExecutionTimeSeconds: number;
	/** Minimum interval between runs (in seconds) */
	minIntervalSeconds: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
	free: {
		schedules: 5,
		executions: 2_000,
		tokenLimit: 100_000,
		maxExecutionTimeSeconds: 60, // 1 minute
		minIntervalSeconds: 5 * 60, // 5 minutes
	},
	pro: {
		schedules: 50,
		executions: 20_000,
		tokenLimit: 300_000,
		maxExecutionTimeSeconds: 5 * 60, // 5 minutes
		minIntervalSeconds: 60, // 1 minute
	},
	enterprise: {
		schedules: -1, // unlimited
		executions: 100_000,
		tokenLimit: 1_000_000,
		maxExecutionTimeSeconds: 15 * 60, // 15 minutes
		minIntervalSeconds: 60, // 1 minute
	},
};
