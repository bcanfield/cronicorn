// filepath: /Users/bcanfield/testapp/packages/database/src/entities/messages.ts
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { messages, type NewMessage, type Message } from "../schema.js";
import type { PaginationParams } from "../types/pagination.js";

export async function createMessage(data: NewMessage) {
  const [message] = await db.insert(messages).values(data).returning();
  return message;
}

export async function getMessages(opts: PaginationParams) {
  if (!opts) {
    opts = { page: 1, limit: 10 };
  }
  return await db
    .select()
    .from(messages)
    .limit(opts.limit)
    .offset((opts.page - 1) * opts.limit);
}

export async function getMessageById(id: string) {
  const [message] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, id))
    .limit(1);
  return message;
}

export async function updateMessage(id: string, data: Partial<Message>) {
  const [message] = await db
    .update(messages)
    .set(data)
    .where(eq(messages.id, id))
    .returning();
  return message;
}

export async function deleteMessage(id: string) {
  const [message] = await db
    .delete(messages)
    .where(eq(messages.id, id))
    .returning();
  return message;
}

/*
BELOW ARE CUSTOM NON-STANDARD FUNCTIONS NOT PART OF THE CRUD OPERATIONS
*/
export async function getJobMessages(jobId: string) {
  const jobMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.jobId, jobId));
  return jobMessages;
}
