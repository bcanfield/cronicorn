import { and, eq } from "drizzle-orm";
import { db } from "../db.js";
import {
  verificationTokens,
  type NewVerificationToken,
  type VerificationToken,
} from "../schema.js";
import type { PaginationParams } from "../types/pagination.js";

export async function createVerificationToken(data: NewVerificationToken) {
  const [vt] = await db.insert(verificationTokens).values(data).returning();
  return vt;
}

export async function getVerificationTokens(opts: PaginationParams) {
  if (!opts) {
    opts = { page: 1, limit: 10 };
  }
  return await db
    .select()
    .from(verificationTokens)
    .limit(opts.limit)
    .offset((opts.page - 1) * opts.limit);
}

export async function getVerificationToken(identifier: string, token: string) {
  const [vt] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, token)
      )
    )
    .limit(1);
  return vt;
}

export async function updateVerificationToken(
  identifier: string,
  token: string,
  data: Partial<VerificationToken>
) {
  const [vt] = await db
    .update(verificationTokens)
    .set(data)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, token)
      )
    )
    .returning();
  return vt;
}

export async function deleteVerificationToken(
  identifier: string,
  token: string
) {
  const [vt] = await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, token)
      )
    )
    .returning();
  return vt;
}
