import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { insertContextEntriesSchema, listContextEntriesSchema, patchContextEntriesSchema, selectContextEntriesSchema } from "@/api/db/schema/context-entries";
import { notFoundSchema } from "@/api/lib/constants";

const tags = ["Context Entries"];

/**
 * Response schema for paginated context entries list
 *
 * Returns:
 * - items: Array of context entry objects matching the query criteria
 * - hasNext: Boolean indicating if there are more results available (for pagination)
 */
const listResponseSchema = z.object({
  items: z.array(selectContextEntriesSchema).describe("Array of context entry objects"),
  hasNext: z.boolean().describe("Indicates if there are more results available for pagination"),
});

export const list = createRoute({
  path: "/context-entries",
  method: "get",
  tags,
  summary: "List context entries",
  operationId: "listContextEntries",
  description: "Retrieve a paginated list of context entries with optional filtering and sorting options. Returns only context entries belonging to the authenticated user.",
  request: { query: listContextEntriesSchema },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      listResponseSchema,
      "The paginated list of context entries with a flag indicating if more results are available",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const create = createRoute({
  path: "/context-entries",
  method: "post",
  tags,
  summary: "Create a new context entry",
  operationId: "createContextEntry",
  description: "Create a new context entry for a job to provide additional context or information that will be used during job execution. Requires an existing job reference.",
  request: {
    body: jsonContentRequired(
      insertContextEntriesSchema,
      "The context entry to create",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectContextEntriesSchema,
      "The created context entry with its assigned ID and metadata",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertContextEntriesSchema),
      "Validation error(s) in the request body",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const getOne = createRoute({
  path: "/context-entries/{id}",
  method: "get",
  tags,
  summary: "Get a specific context entry",
  operationId: "getContextEntry",
  description: "Retrieve details for a specific context entry by ID. Only context entries belonging to the authenticated user can be retrieved.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectContextEntriesSchema,
      "The requested context entry's complete details",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Context entry not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid UUID format for context entry ID",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const patch = createRoute({
  path: "/context-entries/{id}",
  method: "patch",
  tags,
  summary: "Update a context entry",
  operationId: "updateContextEntry",
  description: "Update an existing context entry with partial data. Only context entries belonging to the authenticated user can be modified. At least one field must be provided for update.",
  request: {
    params: IdUUIDParamsSchema,
    body: jsonContentRequired(
      patchContextEntriesSchema,
      "The context entry fields to update",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectContextEntriesSchema,
      "The complete updated context entry after changes",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Context entry not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchContextEntriesSchema).or(createErrorSchema(IdUUIDParamsSchema)),
      "Validation error(s) in request body or invalid UUID format",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const remove = createRoute({
  path: "/context-entries/{id}",
  method: "delete",
  tags,
  summary: "Delete a context entry",
  operationId: "deleteContextEntry",
  description: "Permanently delete a context entry from the system. Only context entries belonging to the authenticated user can be deleted. Returns 204 No Content on success with an empty response body.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Context entry successfully deleted (no response body)",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Context entry not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid UUID format for context entry ID",
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
export type RemoveRoute = typeof remove;
