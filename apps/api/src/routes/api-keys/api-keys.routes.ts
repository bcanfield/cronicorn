import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { createApiKeysSchema, insertApiKeysSchema, listApiKeysSchema, patchApiKeysSchema, selectApiKeysSchema } from "@/api/db/schema";
import { notFoundSchema } from "@/api/lib/constants";

const tags = ["API Keys"];

/**
 * Response schema for paginated API keys list
 *
 * Returns:
 * - items: Array of API key objects matching the query criteria
 * - hasNext: Boolean indicating if there are more results available (for pagination)
 */
const listResponseSchema = z.object({
  items: z.array(selectApiKeysSchema).describe("Array of API key objects"),
  hasNext: z.boolean().describe("Indicates if there are more results available for pagination"),
});

/**
 * Response schema for successful deletion
 */
const deleteSuccessSchema = z.object({
  success: z.boolean().describe("Indicates successful deletion"),
});

export const list = createRoute({
  path: "/api-keys",
  method: "get",
  tags,
  summary: "List API Keys",
  operationId: "listApiKeys",
  description: "Retrieve a paginated list of API keys for the authenticated user with optional filtering and sorting. Returns only API keys belonging to the authenticated user.",
  request: { query: listApiKeysSchema },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      listResponseSchema,
      "The paginated list of API keys with a flag indicating if more results are available",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const create = createRoute({
  path: "/api-keys",
  method: "post",
  tags,
  summary: "Create a new API Key",
  operationId: "createApiKey",
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
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertApiKeysSchema),
      "Validation error(s) in the request body",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const getOne = createRoute({
  path: "/api-keys/{id}",
  method: "get",
  tags,
  summary: "Get a specific API Key",
  operationId: "getApiKey",
  description: "Retrieve details for a specific API key by ID. Only API keys belonging to the authenticated user can be retrieved. Note that the secret is never returned, only metadata about the API key.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectApiKeysSchema,
      "The requested API key's complete details (without secret)",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "API key not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid UUID format for API key ID",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const patch = createRoute({
  path: "/api-keys/{id}",
  method: "patch",
  tags,
  summary: "Update an API Key",
  operationId: "updateApiKey",
  description: "Update an existing API key's metadata such as name, description, or scopes. Only API keys belonging to the authenticated user can be modified. The key and secret values cannot be modified. At least one field must be provided for update.",
  request: {
    params: IdUUIDParamsSchema,
    body: jsonContentRequired(
      patchApiKeysSchema,
      "The API key fields to update",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectApiKeysSchema,
      "The complete updated API key after changes",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "API key not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchApiKeysSchema).or(createErrorSchema(IdUUIDParamsSchema)),
      "Validation error(s) in request body or invalid UUID format",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const revoke = createRoute({
  path: "/api-keys/{id}/revoke",
  method: "post",
  tags,
  summary: "Revoke an API Key",
  operationId: "revokeApiKey",
  description: "Immediately revoke an API key, preventing it from being used for authentication. Only API keys belonging to the authenticated user can be revoked. This action is separate from deletion and can be used for temporary suspension.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectApiKeysSchema,
      "The revoked API key with updated status",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "API key not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid UUID format for API key ID",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const remove = createRoute({
  path: "/api-keys/{id}",
  method: "delete",
  tags,
  summary: "Delete an API Key",
  operationId: "deleteApiKey",
  description: "Permanently delete an API key from the system. Only API keys belonging to the authenticated user can be deleted. This action cannot be undone, and the key will no longer be usable for authentication. Returns success confirmation instead of 204 No Content.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      deleteSuccessSchema,
      "API key successfully deleted with confirmation",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "API key not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid UUID format for API key ID",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type PatchRoute = typeof patch;
export type RevokeRoute = typeof revoke;
export type RemoveRoute = typeof remove;
