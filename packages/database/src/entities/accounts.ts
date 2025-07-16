// filepath: /Users/bcanfield/testapp/packages/database/src/entities/accounts.ts
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { accounts, type NewAccount, type Account } from "../schema.js";
import type { PaginationParams } from "../types/pagination.js";

export async function createAccount(data: NewAccount) {
  const [account] = await db.insert(accounts).values(data).returning();
  return account;
}

export async function getAccounts(opts: PaginationParams) {
  if (!opts) {
    opts = { page: 1, limit: 10 };
  }
  return await db
    .select()
    .from(accounts)
    .limit(opts.limit)
    .offset((opts.page - 1) * opts.limit);
}

export async function getAccountById(id: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id))
    .limit(1);
  return account;
}

export async function updateAccount(id: string, data: Partial<Account>) {
  const [account] = await db
    .update(accounts)
    .set(data)
    .where(eq(accounts.id, id))
    .returning();
  return account;
}

export async function deleteAccount(id: string) {
  const [account] = await db
    .delete(accounts)
    .where(eq(accounts.id, id))
    .returning();
  return account;
}
