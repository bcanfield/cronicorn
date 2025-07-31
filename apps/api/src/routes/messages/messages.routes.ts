import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { createdMessagesSchema, insertMessagesSchema, listMessagesSchema, patchMessagesSchema, selectMessagesSchema } from "@/api/db/schema/messages";
import { notFoundSchema } from "@/api/lib/constants";

const tags = ["Messages"];

const listResponseSchema = z.object({
  items: z.array(selectMessagesSchema),
  hasNext: z.boolean(),
});

export const list = createRoute({
  path: "/messages",
  method: "get",
  tags,
  request: { query: listMessagesSchema },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(listResponseSchema, "The paginated list of messages"),
  },
});

export const create = createRoute({
  path: "/messages",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(insertMessagesSchema, "The message to create"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(createdMessagesSchema, "The created message"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Job not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertMessagesSchema),
      "Validation error(s)",
    ),
  },
});

export const getOne = createRoute({
  path: "/messages/{id}",
  method: "get",
  tags,
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectMessagesSchema, "The requested message"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Message not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid id",
    ),
  },
});

export const patch = createRoute({
  path: "/messages/{id}",
  method: "patch",
  tags,
  request: {
    params: IdUUIDParamsSchema,
    body: jsonContentRequired(patchMessagesSchema, "The message updates"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectMessagesSchema, "The updated message"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Message not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchMessagesSchema)
        .or(createErrorSchema(IdUUIDParamsSchema)),
      "Validation error(s)",
    ),
  },
});

export const remove = createRoute({
  path: "/messages/{id}",
  method: "delete",
  tags,
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: { description: "Message deleted" },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Message not found"),
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
