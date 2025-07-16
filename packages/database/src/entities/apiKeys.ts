// filepath: /Users/bcanfield/testapp/packages/database/src/entities/apiKeys.ts
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { apiKeys, type NewApiKey, type ApiKey } from "../schema.js";
import type { PaginationParams } from "../types/pagination.js";

export async function createApiKey(data: NewApiKey) {
  const [key] = await db.insert(apiKeys).values(data).returning();
  return key;
}

export async function getApiKeys(opts: PaginationParams) {
  if (!opts) {
    opts = { page: 1, limit: 10 };
  }
  return await db
    .select()
    .from(apiKeys)
    .limit(opts.limit)
    .offset((opts.page - 1) * opts.limit);
}

export async function getApiKeyById(id: string) {
  const [key] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.id, id))
    .limit(1);
  return key;
}

export async function updateApiKey(id: string, data: Partial<ApiKey>) {
  const [key] = await db
    .update(apiKeys)
    .set(data)
    .where(eq(apiKeys.id, id))
    .returning();
  return key;
}

export async function deleteApiKey(id: string) {
  const [key] = await db.delete(apiKeys).where(eq(apiKeys.id, id)).returning();
  return key;
}
