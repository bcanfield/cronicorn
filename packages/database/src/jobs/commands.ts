import { and, eq } from "drizzle-orm";
import { db } from "..";
import { jobs } from "../schema";

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
