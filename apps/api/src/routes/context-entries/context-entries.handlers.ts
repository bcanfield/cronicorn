import { and, asc, desc, eq, getTableColumns, ilike } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/api/lib/types";

import db from "@/api/db";
import { contextEntries, jobs } from "@/api/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/api/lib/constants";

import type { CreateRoute, GetOneRoute, ListRoute, PatchRoute, RemoveRoute } from "./context-entries.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  // List context entries for authenticated user's jobs
  const authUser = c.get("authUser");

  if (!authUser || !authUser.user || !authUser.user.id) {
    throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
      message: "Authentication required",
    });
  }

  const userId = authUser.user.id;
  const { page, pageSize, sortBy, sortDirection, searchQuery, jobId } = c.req.valid("query");

  const offset = (page - 1) * pageSize;
  const limit = pageSize + 1;

  const cols = getTableColumns(contextEntries);
  const sortColumn = cols[sortBy as keyof typeof cols];

  const whereConditions = [eq(jobs.userId, userId)];
  if (jobId) {
    whereConditions.push(eq(contextEntries.jobId, jobId));
  }
  if (searchQuery) {
    // Search in key or value - using OR to match either field
    whereConditions.push(
      ilike(contextEntries.key, `%${searchQuery}%`),
    );
  }

  const result = await db
    .select()
    .from(jobs)
    .innerJoin(contextEntries, eq(jobs.id, contextEntries.jobId))
    .where(and(...whereConditions))
    .orderBy(
      sortDirection === "asc"
        ? asc(sortColumn)
        : desc(sortColumn),
    )
    .limit(limit)
    .offset(offset);
  const items = result.map(r => r.ContextEntry);

  const hasNext = items.length > pageSize;
  return c.json({ items: items.slice(0, pageSize), hasNext }, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const authUser = c.get("authUser");

  if (!authUser || !authUser.user || !authUser.user.id) {
    throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
      message: "Authentication required",
    });
  }

  const userId = authUser.user.id;
  const { jobId, ...rest } = c.req.valid("json");

  // ensure job belongs to user
  const jobRec = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  if (!jobRec || jobRec.userId !== userId) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  const [inserted] = await db.insert(contextEntries).values({ jobId, ...rest }).returning();
  return c.json(inserted, HttpStatusCodes.OK);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const authUser = c.get("authUser");

  if (!authUser || !authUser.user || !authUser.user.id) {
    throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
      message: "Authentication required",
    });
  }

  const userId = authUser.user.id;
  const { id } = c.req.valid("param");

  const [found] = await db
    .select()
    .from(jobs)
    .innerJoin(contextEntries, eq(jobs.id, contextEntries.jobId))
    .where(and(eq(contextEntries.id, id), eq(jobs.userId, userId)));

  if (!found?.ContextEntry) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  return c.json(found.ContextEntry, HttpStatusCodes.OK);
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

  // ensure context entry belongs to authenticated user via job ownership
  const authUser = c.get("authUser");

  if (!authUser || !authUser.user || !authUser.user.id) {
    throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
      message: "Authentication required",
    });
  }

  const userId = authUser.user.id;
  const check = await db
    .select()
    .from(contextEntries)
    .innerJoin(jobs, eq(contextEntries.jobId, jobs.id))
    .where(
      and(
        eq(contextEntries.id, id),
        eq(jobs.userId, userId),
      ),
    );
  if (check.length === 0) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }
  const [updated] = await db.update(contextEntries).set(updates).where(eq(contextEntries.id, id)).returning();
  return c.json(updated, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const authUser = c.get("authUser");

  if (!authUser || !authUser.user || !authUser.user.id) {
    throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
      message: "Authentication required",
    });
  }

  const userId = authUser.user.id;

  const result = await db
    .select()
    .from(contextEntries)
    .innerJoin(jobs, eq(contextEntries.jobId, jobs.id))
    .where(
      and(
        eq(contextEntries.id, id),
        eq(jobs.userId, userId),
      ),
    );

  if (result.length === 0) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  await db.delete(contextEntries).where(eq(contextEntries.id, id));
  return c.body(null, HttpStatusCodes.NO_CONTENT);
};
