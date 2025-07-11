import { db } from "../index.js";
import { messages } from "../schema.js";
import { eq, asc } from "drizzle-orm";

/**
 * Fetch all messages for a job, sorted ascending by creation time.
 */
export async function getMessageHistory(jobId: string) {
	return db
		.select({
			role: messages.role,
			content: messages.content,
		})
		.from(messages)
		.where(eq(messages.jobId, jobId))
		.orderBy(asc(messages.createdAt));
}
