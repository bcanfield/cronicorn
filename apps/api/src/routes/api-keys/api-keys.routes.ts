import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { insertApiKeysSchema, listApiKeysSchema, patchApiKeysSchema, selectApiKeysSchema } from "@/api/db/schema/api-keys.schema";
import { notFoundSchema } from "@/api/lib/constants";

const tags = ["API Keys"];

// Response schema for paginated API keys list
const listResponseSchema = z.object({
  items: z.array(selectApiKeysSchema.omit({ secret: true })),
  hasNext: z.boolean(),
});

// Response schema for successful deletion
const deleteSuccessSchema = z.object({
  success: z.boolean(),
});

export const list = createRoute({
  path: "/api-keys",
  method: "get",
  tags,
  request: { query: listApiKeysSchema },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      listResponseSchema,
      "The paginated list of API keys",
    ),
  },
});

export const create = createRoute({
  path: "/api-keys",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      insertApiKeysSchema,
      "The API key to create",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectApiKeysSchema,
      "The created API key",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertApiKeysSchema),
      "Validation error(s)",
    ),
  },
});

export const getOne = createRoute({
  path: "/api-keys/{id}",
  method: "get",
  tags,
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectApiKeysSchema.omit({ secret: true }),
      "The requested API key",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "API key not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid id",
    ),
  },
});

export const patch = createRoute({
  path: "/api-keys/{id}",
  method: "patch",
  tags,
  request: {
    params: IdUUIDParamsSchema,
    body: jsonContentRequired(
      patchApiKeysSchema,
      "The API key updates",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectApiKeysSchema.omit({ secret: true }),
      "The updated API key",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "API key not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchApiKeysSchema).or(createErrorSchema(IdUUIDParamsSchema)),
      "Validation error(s)",
    ),
  },
});

export const revoke = createRoute({
  path: "/api-keys/{id}/revoke",
  method: "post",
  tags,
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectApiKeysSchema.omit({ secret: true }),
      "The revoked API key",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "API key not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid id",
    ),
  },
});

export const remove = createRoute({
  path: "/api-keys/{id}",
  method: "delete",
  tags,
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      deleteSuccessSchema,
      "API key successfully deleted",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "API key not found",
    ),
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
export type RevokeRoute = typeof revoke;
export type RemoveRoute = typeof remove;
