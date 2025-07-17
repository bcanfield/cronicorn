// filepath: /Users/bcanfield/testapp/packages/database/src/entities/jobs.ts
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { jobs, type NewJob, type Job } from "../schema.js";
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
