import { and, eq } from "drizzle-orm";
import { db } from "../index.js";
import { type Job, jobs } from "../schema.js";
import { sql } from "drizzle-orm";

export function lockJob(jobId: string) {
	return db
		.update(jobs)
		.set({ locked: true })
		.where(and(eq(jobs.id, jobId), eq(jobs.locked, false)))
		.returning();
}

export function unlockJob(jobId: string) {
	return db.update(jobs).set({ locked: false }).where(eq(jobs.id, jobId)).execute();
}

export function updateJob(job: Partial<Job> & { id: string }) {
	return db.update(jobs).set(job).where(eq(jobs.id, job.id)).returning().execute();
}

export async function incrementJobUsage(jobId: string, usage: Partial<Job>): Promise<void> {
	await db
		.update(jobs)
		.set({
			cachedInputTokens: sql`${jobs.cachedInputTokens} + ${usage.cachedInputTokens ?? 0}`,
			inputTokens: sql`${jobs.inputTokens}       + ${usage.inputTokens ?? 0}`,
			outputTokens: sql`${jobs.outputTokens}      + ${usage.outputTokens ?? 0}`,
			totalTokens: sql`${jobs.totalTokens}       + ${usage.totalTokens ?? 0}`,
			reasoningTokens: sql`${jobs.reasoningTokens}   + ${usage.reasoningTokens ?? 0}`,
		})
		.where(eq(jobs.id, jobId))
		.execute();
}
