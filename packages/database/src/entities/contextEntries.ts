// filepath: /Users/bcanfield/testapp/packages/database/src/entities/contextEntries.ts
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import {
  contextEntries,
  type NewContextEntry,
  type ContextEntry,
} from "../schema.js";
import type { PaginationParams } from "../types/pagination.js";

export async function createContextEntry(data: NewContextEntry) {
  const [entry] = await db.insert(contextEntries).values(data).returning();
  return entry;
}

export async function getContextEntries(opts: PaginationParams) {
  if (!opts) opts = { page: 1, limit: 10 };
  return await db
    .select()
    .from(contextEntries)
    .limit(opts.limit)
    .offset((opts.page - 1) * opts.limit);
}

export async function getContextEntryById(id: string) {
  const [entry] = await db
    .select()
    .from(contextEntries)
    .where(eq(contextEntries.id, id))
    .limit(1);
  return entry;
}

export async function updateContextEntry(
  id: string,
  data: Partial<ContextEntry>
) {
  const [entry] = await db
    .update(contextEntries)
    .set(data)
    .where(eq(contextEntries.id, id))
    .returning();
  return entry;
}

export async function deleteContextEntry(id: string) {
  const [entry] = await db
    .delete(contextEntries)
    .where(eq(contextEntries.id, id))
    .returning();
  return entry;
}
