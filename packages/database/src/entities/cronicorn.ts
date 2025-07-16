import { db } from "../db.js";
import { messages } from "../schema.js";
import type { PaginationParams } from "../types/pagination.js";

export async function getCronicornMessages(opts: PaginationParams) {
  if (!opts) {
    opts = { page: 1, limit: 10 };
  }
  return await db
    .select()
    .from(messages)
    .limit(opts.limit)
    .offset((opts.page - 1) * opts.limit);
}
