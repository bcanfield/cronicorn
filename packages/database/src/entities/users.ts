import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { users, type NewUser, type User } from "../schema.js";
import type { PaginationParams } from "../types/pagination.js";

export async function createUser(data: NewUser) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function getUsers(opts: PaginationParams) {
  if (!opts) {
    opts = { page: 1, limit: 10 };
  }
  return await db
    .select()
    .from(users)
    .limit(opts.limit)
    .offset((opts.page - 1) * opts.limit);
}

export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

export async function updateUser(id: string, data: Partial<User>) {
  const [user] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();
  return user;
}

export async function deleteUser(id: string) {
  const [user] = await db.delete(users).where(eq(users.id, id)).returning();
  return user;
}
