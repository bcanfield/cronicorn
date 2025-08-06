import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/api/lib/types";

import db from "@/api/db";
import { apiKeys } from "@/api/db/schema";
import {
  generateApiKeyAndSecret,
  hashApiKeySecret,
} from "@/api/lib/api-key-utils";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/api/lib/constants";

import type { CreateRoute, GetOneRoute, ListRoute, PatchRoute, RemoveRoute, RevokeRoute } from "./api-keys.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  // Restrict to authenticated user's API keys
  const authUser = c.get("authUser");

  if (!authUser || !authUser.user || !authUser.user.id) {
    throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
      message: "Authentication required",
    });
  }

  const userId = authUser.user.id;
  const { page, pageSize, sortBy, sortDirection } = c.req.valid("query");

  // Calculate pagination offsets
  const offset = (page - 1) * pageSize;
  const limit = pageSize + 1;

  // Fetch with pagination and sorting
  const items = await db.query.apiKeys.findMany({
    where: (fields, { eq }) => eq(fields.userId, userId),
    orderBy: (fields, { asc, desc }) =>
      sortDirection === "asc"
        ? asc(fields[sortBy as keyof typeof fields])
        : desc(fields[sortBy as keyof typeof fields]),
    limit,
    offset,
  });

  // Determine if there is a next page
  const hasNext = items.length > pageSize;
  const resultItems = hasNext ? items.slice(0, pageSize) : items;

  // Remove secret from results for security
  const sanitizedItems = resultItems.map(item => ({
    ...item,
    secret: undefined, // Remove secret from API response
  }));

  return c.json({ items: sanitizedItems, hasNext }, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const authUser = c.get("authUser");

  if (!authUser || !authUser.user || !authUser.user.id) {
    throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
      message: "Authentication required",
    });
  }

  const userId = authUser.user.id;
  const apiKeyInput = c.req.valid("json");

  // Generate API key and secret - the generator ensures they meet validation requirements
  const { key, secret } = generateApiKeyAndSecret();

  // Hash the secret for storage
  const { hash, salt } = hashApiKeySecret(secret);

  const [inserted] = await db.insert(apiKeys).values({
    ...apiKeyInput,
    userId,
    key,
    secret: hash,
    secretSalt: salt,
  }).returning();

  return c.json(inserted, HttpStatusCodes.CREATED);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  // Fetch API key belonging to authenticated user
  const authUser = c.get("authUser");

  if (!authUser || !authUser.user || !authUser.user.id) {
    throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
      message: "Authentication required",
    });
  }

  const userId = authUser.user.id;
  const { id } = c.req.valid("param");

  const found = await db.query.apiKeys.findFirst({
    where: (fields, { eq, and }) =>
      and(eq(fields.id, id), eq(fields.userId, userId)),
  });

  if (!found) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  // Remove secret from response for security
  const { secret, ...apiKeyWithoutSecret } = found;

  return c.json(apiKeyWithoutSecret, HttpStatusCodes.OK);
};

export const patch: AppRouteHandler<PatchRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const updates = c.req.valid("json");

  if (Object.keys(updates).length === 0) {
    return c.json(
      {
        success: false,
        error: {
          issues: [
            { code: ZOD_ERROR_CODES.INVALID_UPDATES, path: [], message: ZOD_ERROR_MESSAGES.NO_UPDATES },
          ],
          name: "ZodError",
        },
      },
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  // Only allow updating user's own API key
  const authUser = c.get("authUser");

  if (!authUser || !authUser.user || !authUser.user.id) {
    throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
      message: "Authentication required",
    });
  }

  const userId = authUser.user.id;

  const [updated] = await db.update(apiKeys)
    .set(updates)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
    .returning();

  if (!updated) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  // Remove secret from response for security
  const { secret, ...apiKeyWithoutSecret } = updated;

  return c.json(apiKeyWithoutSecret, HttpStatusCodes.OK);
};

export const revoke: AppRouteHandler<RevokeRoute> = async (c) => {
  const { id } = c.req.valid("param");

  // Only allow revoking user's own API key
  const authUser = c.get("authUser");

  if (!authUser || !authUser.user || !authUser.user.id) {
    throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
      message: "Authentication required",
    });
  }

  const userId = authUser.user.id;

  const [updated] = await db.update(apiKeys)
    .set({ revoked: true })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
    .returning();

  if (!updated) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  // Remove secret from response for security
  const { secret, ...apiKeyWithoutSecret } = updated;

  return c.json(apiKeyWithoutSecret, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");

  // Only allow deleting user's own API key
  const authUser = c.get("authUser");

  if (!authUser || !authUser.user || !authUser.user.id) {
    throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
      message: "Authentication required",
    });
  }

  const userId = authUser.user.id;

  const [deleted] = await db.delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
    .returning();

  if (!deleted) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  return c.json({ success: true }, HttpStatusCodes.OK);
};
