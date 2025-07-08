import { prisma } from "@cronicorn/database";

export interface UserUsage {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	reasoningTokens: number;
	cachedInputTokens: number;
}

/**
 * Fetches the sum total of various token usages for all jobs belonging to a given user.
 *
 * @param userId - The ID of the user whose jobs you want to aggregate.
 * @returns An object with summed up token counts (zeros if no jobs found).
 */
export async function getUserTotalUsage({ userId }: { userId: string }): Promise<UserUsage> {
	const result = await prisma.job.aggregate({
		where: { userId },
		_sum: {
			inputTokens: true,
			outputTokens: true,
			totalTokens: true,
			reasoningTokens: true,
			cachedInputTokens: true,
		},
	});

	const sums = result._sum;

	return {
		inputTokens: sums.inputTokens ?? 0,
		outputTokens: sums.outputTokens ?? 0,
		totalTokens: sums.totalTokens ?? 0,
		reasoningTokens: sums.reasoningTokens ?? 0,
		cachedInputTokens: sums.cachedInputTokens ?? 0,
	};
}
