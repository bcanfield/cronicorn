import { asc, eq } from "drizzle-orm";
import { contextEntries, type NewContextEntry } from "../schema.js";
import { db } from "../index.js";

export async function createContextEntry(val: NewContextEntry): Promise<void> {
	await db.insert(contextEntries).values(val).execute();
}

export async function getContextEntries(jobId: string) {
	return await db
		.select()
		.from(contextEntries)
		.where(eq(contextEntries.jobId, jobId))
		.orderBy(asc(contextEntries.createdAt));
}
