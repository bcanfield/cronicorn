import { and, eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/api/lib/types";

import db from "@/api/db";
import { jobs } from "@/api/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/api/lib/constants";

import type { CreateRoute, GetOneRoute, ListRoute, PatchRoute, RemoveRoute } from "./jobs.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  // Restrict to authenticated user's jobs
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;
  const { page, pageSize, sortBy, sortDirection, searchQuery } = c.req.valid("query");
  // Calculate pagination offsets
  const offset = (page - 1) * pageSize;
  const limit = pageSize + 1;
  // Fetch with optional search, sorting, and pagination
  // Fetch jobs with pagination, sorting, and optional search
  const items = await db.query.jobs.findMany({
    where: (fields, { eq, ilike, and }) => {
      const baseCond = eq(fields.userId, userId);
      if (searchQuery) {
        return and(baseCond, ilike(fields.definitionNL, `%${searchQuery}%`));
      }
      return baseCond;
    },
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
  return c.json({ items: resultItems, hasNext }, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;
  const jobInput = c.req.valid("json");
  const [inserted] = await db.insert(jobs).values({ ...jobInput, userId }).returning();

  // const [inserted] = await db.insert(jobs).values({ ...jobInput, userId: authUser!.user!.id }).returning();
  return c.json(inserted, HttpStatusCodes.OK);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  // Fetch job belonging to authenticated user
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;
  const { id } = c.req.valid("param");
  const found = await db.query.jobs.findFirst({
    where: (fields, { eq, and }) =>
      and(eq(fields.id, id), eq(fields.userId, userId)),
  });
  if (!found) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }
  return c.json(found, HttpStatusCodes.OK);
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
  // Only allow updating user's own job
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;
  const [updated] = await db.update(jobs)
    .set(updates)
    .where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
    .returning();
  if (!updated) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }
  return c.json(updated, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");
  // Only allow deleting user's own job
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;
  const result = await db.delete(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
    .returning({ deletedId: jobs.id });
  if (result.length === 0) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }
  return c.body(null, HttpStatusCodes.NO_CONTENT);
};
