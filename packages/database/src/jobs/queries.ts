import { db } from "../index.js";
import { jobs, endpoints } from "../schema.js";
import { eq } from "drizzle-orm";

/**
 * Fetch a single job by ID, including its endpoints.
 */
export async function getJobWithEndpoints(jobId: string) {
	// 1) pull the job row
	const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

	if (!job) return null;

	// 2) pull its endpoints
	const eps = await db.select().from(endpoints).where(eq(endpoints.jobId, jobId));

	return { ...job, endpoints: eps };
}
