// filepath: /Users/bcanfield/testapp/packages/database/src/entities/endpoints.ts
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { endpoints, type NewEndpoint, type Endpoint } from "../schema.js";
import type { PaginationParams } from "../types/pagination.js";

export async function createEndpoint(data: NewEndpoint) {
  const [endpoint] = await db.insert(endpoints).values(data).returning();
  return endpoint;
}

export async function getEndpoints(opts: PaginationParams) {
  if (!opts) {
    opts = { page: 1, limit: 10 };
  }
  return await db
    .select()
    .from(endpoints)
    .limit(opts.limit)
    .offset((opts.page - 1) * opts.limit);
}

export async function getEndpointById(id: string) {
  const [endpoint] = await db
    .select()
    .from(endpoints)
    .where(eq(endpoints.id, id))
    .limit(1);
  return endpoint;
}

export async function updateEndpoint(id: string, data: Partial<Endpoint>) {
  const [endpoint] = await db
    .update(endpoints)
    .set(data)
    .where(eq(endpoints.id, id))
    .returning();
  return endpoint;
}

export async function deleteEndpoint(id: string) {
  const [endpoint] = await db
    .delete(endpoints)
    .where(eq(endpoints.id, id))
    .returning();
  return endpoint;
}
