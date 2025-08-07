import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { createdMessagesSchema, insertMessagesSchema, listMessagesSchema, patchMessagesSchema, selectMessagesSchema } from "@/api/db/schema/messages";
import { notFoundSchema } from "@/api/lib/constants";

const tags = ["Messages"];

/**
 * Response schema for paginated messages list
 *
 * Returns:
 * - items: Array of message objects matching the query criteria
 * - hasNext: Boolean indicating if there are more results available (for pagination)
 */
const listResponseSchema = z.object({
  items: z.array(selectMessagesSchema).describe("Array of message objects"),
  hasNext: z.boolean().describe("Indicates if there are more results available for pagination"),
});

export const list = createRoute({
  path: "/messages",
  method: "get",
  tags,
  summary: "List messages",
  operationId: "listMessages",
  description: "Retrieve a paginated list of messages with optional filtering by job ID or other criteria. Returns only messages belonging to the authenticated user.",
  request: { 
    query: listMessagesSchema, 
    params: z.object({ jobId: z.string().uuid().optional() }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      listResponseSchema,
      "The paginated list of messages with a flag indicating if more results are available",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const create = createRoute({
  path: "/messages",
  method: "post",
  tags,
  summary: "Create a new message",
  operationId: "createMessage",
  description: "Create a new message for a job conversation or communication thread. Messages are typically used to store conversation history or instructions. Requires an existing job reference.",
  request: {
    body: jsonContentRequired(
      insertMessagesSchema,
      "The message to create",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createdMessagesSchema,
      "The created message with its assigned ID and metadata",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertMessagesSchema),
      "Validation error(s) in the request body",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const getOne = createRoute({
  path: "/messages/{id}",
  method: "get",
  tags,
  summary: "Get a specific message",
  operationId: "getMessage",
  description: "Retrieve details for a specific message by ID. Only messages belonging to the authenticated user can be retrieved.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectMessagesSchema,
      "The requested message's complete details",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Message not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid UUID format for message ID",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const patch = createRoute({
  path: "/messages/{id}",
  method: "patch",
  tags,
  summary: "Update a message",
  operationId: "updateMessage",
  description: "Update an existing message with partial data. Only messages belonging to the authenticated user can be modified. At least one field must be provided for update.",
  request: {
    params: IdUUIDParamsSchema,
    body: jsonContentRequired(
      patchMessagesSchema,
      "The message fields to update",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectMessagesSchema,
      "The complete updated message after changes",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Message not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchMessagesSchema).or(createErrorSchema(IdUUIDParamsSchema)),
      "Validation error(s) in request body or invalid UUID format",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const remove = createRoute({
  path: "/messages/{id}",
  method: "delete",
  tags,
  summary: "Delete a message",
  operationId: "deleteMessage",
  description: "Permanently delete a message from the system. Only messages belonging to the authenticated user can be deleted. Returns 204 No Content on success with an empty response body.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Message successfully deleted (no response body)",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Message not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid UUID format for message ID",
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
