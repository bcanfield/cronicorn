import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { createApiKeysSchema, insertApiKeysSchema, listApiKeysSchema, patchApiKeysSchema, selectApiKeysSchema } from "@/api/db/schema.js";
import { notFoundSchema } from "@/api/lib/constants.js";

const tags = ["API Keys"];

// Response schema for paginated API keys list
const listResponseSchema = z.object({
  items: z.array(selectApiKeysSchema),
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
  summary: "List API Keys",
  description: "Retrieve a paginated list of API keys for the authenticated user with optional filtering and sorting.",
  request: { query: listApiKeysSchema },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      listResponseSchema,
      "The paginated list of API keys",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      notFoundSchema,
      "Authentication required",
    ),

  },
});

export const create = createRoute({
  path: "/api-keys",
  method: "post",
  tags,
  summary: "Create API Key",
  description: "Generate a new API key for the authenticated user. The API key secret is only shown once during creation and cannot be retrieved later.",
  request: {
    body: jsonContentRequired(
      insertApiKeysSchema,
      "The API key to create",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      createApiKeysSchema,
      "The created API key with its secret (only shown once)",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      notFoundSchema,
      "Authentication required",
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
  summary: "Get API Key",
  description: "Retrieve details for a specific API key by ID. Note that the secret is never returned, only metadata about the API key.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectApiKeysSchema,
      "The requested API key details (without secret)",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      notFoundSchema,
      "Authentication required",
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
  summary: "Update API Key",
  description: "Update an existing API key's metadata such as name, description, or scopes. The key and secret values cannot be modified.",
  request: {
    params: IdUUIDParamsSchema,
    body: jsonContentRequired(
      patchApiKeysSchema,
      "The API key updates",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectApiKeysSchema,
      "The updated API key",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      notFoundSchema,
      "Authentication required",
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
  summary: "Revoke API Key",
  description: "Immediately revoke an API key, preventing it from being used for authentication. This action is separate from deletion and can be used for temporary suspension.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectApiKeysSchema,
      "The revoked API key",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      notFoundSchema,
      "Authentication required",
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
  summary: "Delete API Key",
  description: "Permanently delete an API key from the system. This action cannot be undone, and the key will no longer be usable for authentication.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      deleteSuccessSchema,
      "API key successfully deleted",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      notFoundSchema,
      "Authentication required",
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
