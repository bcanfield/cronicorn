import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { insertContextEntriesSchema, listContextEntriesSchema, patchContextEntriesSchema, selectContextEntriesSchema } from "@/api/db/schema/context-entries";
import { notFoundSchema } from "@/api/lib/constants";

const tags = ["ContextEntries"];

const listResponseSchema = z.object({
  items: z.array(selectContextEntriesSchema),
  hasNext: z.boolean(),
});

export const list = createRoute({
  path: "/context-entries",
  method: "get",
  tags,
  request: { query: listContextEntriesSchema },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(listResponseSchema, "The paginated list of context entries"),
  },
});

export const create = createRoute({
  path: "/context-entries",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(insertContextEntriesSchema, "The context entry to create"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectContextEntriesSchema, "The created context entry"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Job not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertContextEntriesSchema),
      "Validation error(s)",
    ),
  },
});

export const getOne = createRoute({
  path: "/context-entries/{id}",
  method: "get",
  tags,
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectContextEntriesSchema, "The requested context entry"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Context entry not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid id",
    ),
  },
});

export const patch = createRoute({
  path: "/context-entries/{id}",
  method: "patch",
  tags,
  request: {
    params: IdUUIDParamsSchema,
    body: jsonContentRequired(patchContextEntriesSchema, "The context entry updates"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectContextEntriesSchema, "The updated context entry"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Context entry not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchContextEntriesSchema)
        .or(createErrorSchema(IdUUIDParamsSchema)),
      "Validation error(s)",
    ),
  },
});

export const remove = createRoute({
  path: "/context-entries/{id}",
  method: "delete",
  tags,
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: { description: "Context entry deleted" },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Context entry not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid id",
    ),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type PatchRoute = typeof patch;
export type RemoveRoute = typeof remove;
