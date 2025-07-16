// filepath: /Users/bcanfield/testapp/packages/database/src/entities/jobs.ts
import { eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { jobs, type NewJob, type Job, endpoints } from "../schema.js";
import type { PaginationParams } from "../types/pagination.js";

export async function createJob(data: NewJob) {
  const [job] = await db.insert(jobs).values(data).returning();
  return job;
}

export async function getJobs(opts: PaginationParams) {
  if (!opts) {
    opts = { page: 1, limit: 10 };
  }
  return await db
    .select()
    .from(jobs)
    .limit(opts.limit)
    .offset((opts.page - 1) * opts.limit);
}

export async function getJobById(id: string) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return job;
}

export async function updateJob(id: string, data: Partial<Job>) {
  const [job] = await db
    .update(jobs)
    .set(data)
    .where(eq(jobs.id, id))
    .returning();
  return job;
}

export async function deleteJob(id: string) {
  const [job] = await db.delete(jobs).where(eq(jobs.id, id)).returning();
  return job;
}

/*
BELOW ARE CUSTOM NON-STANDARD FUNCTIONS NOT PART OF THE CRUD OPERATIONS
*/
export async function incrementJobTokens(
  jobId: string,
  usage: Pick<
    Job,
    | "cachedInputTokens"
    | "inputTokens"
    | "outputTokens"
    | "totalTokens"
    | "reasoningTokens"
  >
) {
  const [updated] = await db
    .update(jobs)
    .set({
      cachedInputTokens: sql`${jobs.cachedInputTokens} + ${
        usage.cachedInputTokens ?? 0
      }`,
      inputTokens: sql`${jobs.inputTokens}       + ${usage.inputTokens ?? 0}`,
      outputTokens: sql`${jobs.outputTokens}      + ${usage.outputTokens ?? 0}`,
      totalTokens: sql`${jobs.totalTokens}       + ${usage.totalTokens ?? 0}`,
      reasoningTokens: sql`${jobs.reasoningTokens}   + ${
        usage.reasoningTokens ?? 0
      }`,
    })
    .where(eq(jobs.id, jobId))
    .returning();

  return updated;
}

/**
 * Fetch a job and all of its endpoints.
 * Returns `null` if no job exists with the given id.
 */
export async function getJobWithEndpoints(jobId: string) {
  // select both tables
  const rows = await db
    .select({
      job: jobs,
      endpoint: endpoints,
    })
    .from(jobs)
    .leftJoin(endpoints, eq(endpoints.jobId, jobs.id))
    .where(eq(jobs.id, jobId));

  if (rows.length === 0) return null;

  // extract the Job from the first row
  const { job } = rows[0]!;

  // collect all non-null endpoints
  const eps = rows.map((r) => r.endpoint).filter((e) => e !== null);

  return { ...job, endpoints: eps };
}
