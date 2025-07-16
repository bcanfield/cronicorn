// filepath: /Users/bcanfield/testapp/packages/database/src/entities/sessions.ts
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { sessions, type NewSession, type Session } from "../schema.js";
import type { PaginationParams } from "../types/pagination.js";

export async function createSession(data: NewSession) {
  const [session] = await db.insert(sessions).values(data).returning();
  return session;
}

export async function getSessions(opts: PaginationParams) {
  if (!opts) {
    opts = { page: 1, limit: 10 };
  }
  return await db
    .select()
    .from(sessions)
    .limit(opts.limit)
    .offset((opts.page - 1) * opts.limit);
}

export async function getSessionById(id: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);
  return session;
}

export async function updateSession(id: string, data: Partial<Session>) {
  const [session] = await db
    .update(sessions)
    .set(data)
    .where(eq(sessions.id, id))
    .returning();
  return session;
}

export async function deleteSession(id: string) {
  const [session] = await db
    .delete(sessions)
    .where(eq(sessions.id, id))
    .returning();
  return session;
}
