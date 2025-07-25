import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/api/lib/types";

import db from "@/api/db";
import { jobs } from "@/api/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/api/lib/constants";
import { buildQueryOptions } from "@/api/lib/query-utils";

import type { CreateRoute, GetOneRoute, ListRoute, PatchRoute, RemoveRoute } from "./jobs.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const params = c.req.valid("query");
  console.log({ params });
  // Build full query options (pagination, sorting, filtering)
  const options = buildQueryOptions(
    params,
    jobs,
    ["definitionNL", "createdAt", "updatedAt", "nextRunAt"] as const,
    ["status", "userId"] as const,
  );
  console.log({ options });
  const records = await db.query.jobs.findMany(options);
  return c.json(records);
};

// TODO: Get user from authUser
export const create: AppRouteHandler<CreateRoute> = async (c) => {
  // const authUser = c.get("authUser");
  const jobInput = c.req.valid("json");
  console.log({ jobInput });
  const [inserted] = await db.insert(jobs).values({ ...jobInput }).returning();

  // const [inserted] = await db.insert(jobs).values({ ...jobInput, userId: authUser.user!.id }).returning();
  return c.json(inserted, HttpStatusCodes.OK);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const found = await db.query.jobs.findFirst({
    where(fields, ops) {
      return ops.eq(fields.id, id);
    },
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
  const [updated] = await db.update(jobs).set(updates).where(eq(jobs.id, id)).returning();
  if (!updated) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }
  return c.json(updated, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const result = await db.delete(jobs).where(eq(jobs.id, id)).returning({ deletedId: jobs.id });
  if (result.length === 0) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }
  return c.body(null, HttpStatusCodes.NO_CONTENT);
};
