import { messages, type NewMessage } from "../schema.js";
import { db } from "../index.js";

/**
 * Bulk‐insert a batch of message rows.
 */
export async function insertMessagesForJob(messagesList: NewMessage[]): Promise<void> {
	await db.insert(messages).values(messagesList).execute();
}
