import { PLAN_LIMITS } from "./plan-limits";

export function canCreateSchedule(userPlan: keyof typeof PLAN_LIMITS, currentCount: number) {
	const limit = PLAN_LIMITS[userPlan].schedules;
	return limit < 0 || currentCount < limit;
}

export function exceedsTokenBudget(userPlan: keyof typeof PLAN_LIMITS, tokensUsed: number) {
	return tokensUsed > PLAN_LIMITS[userPlan].tokenLimit;
}
