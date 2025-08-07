import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { insertEndpointsSchema, listEndpointsSchema, patchEndpointsSchema, selectEndpointsSchema } from "@/api/db/schema/endpoints";
import { notFoundSchema } from "@/api/lib/constants";

const tags = ["Endpoints"];

/**
 * Response schema for paginated endpoints list
 *
 * Returns:
 * - items: Array of endpoint objects matching the query criteria
 * - hasNext: Boolean indicating if there are more results available (for pagination)
 */
const listResponseSchema = z.object({
  items: z.array(selectEndpointsSchema).describe("Array of endpoint objects"),
  hasNext: z.boolean().describe("Indicates if there are more results available for pagination"),
});

export const list = createRoute({
  path: "/endpoints",
  method: "get",
  tags,
  summary: "List endpoints",
  operationId: "listEndpoints",
  description: "Retrieve a paginated list of endpoints with optional filtering by job ID, status, or other criteria. Returns only endpoints belonging to the authenticated user.",
  request: { query: listEndpointsSchema },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      listResponseSchema,
      "The paginated list of endpoints with a flag indicating if more results are available",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const create = createRoute({
  path: "/endpoints",
  method: "post",
  tags,
  summary: "Create a new endpoint",
  operationId: "createEndpoint",
  description: "Create a new endpoint configuration for a job to interact with an external service or API. Includes URL, method, headers, and authentication details. Requires an existing job reference.",
  request: {
    body: jsonContentRequired(
      insertEndpointsSchema,
      "The endpoint to create",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectEndpointsSchema,
      "The created endpoint with its assigned ID and metadata",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertEndpointsSchema),
      "Validation error(s) in the request body",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const getOne = createRoute({
  path: "/endpoints/{id}",
  method: "get",
  tags,
  summary: "Get a specific endpoint",
  operationId: "getEndpoint",
  description: "Retrieve details for a specific endpoint by ID, including its configuration, usage statistics, and last execution status. Only endpoints belonging to the authenticated user can be retrieved.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectEndpointsSchema,
      "The requested endpoint's complete details",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Endpoint not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid UUID format for endpoint ID",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const patch = createRoute({
  path: "/endpoints/{id}",
  method: "patch",
  tags,
  summary: "Update an endpoint",
  operationId: "updateEndpoint",
  description: "Modify an existing endpoint's configuration, such as changing the URL, method, headers, or authentication details. Only endpoints belonging to the authenticated user can be modified. At least one field must be provided for update.",
  request: {
    params: IdUUIDParamsSchema,
    body: jsonContentRequired(
      patchEndpointsSchema,
      "The endpoint fields to update",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectEndpointsSchema,
      "The complete updated endpoint after changes",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Endpoint not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchEndpointsSchema).or(createErrorSchema(IdUUIDParamsSchema)),
      "Validation error(s) in request body or invalid UUID format",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const remove = createRoute({
  path: "/endpoints/{id}",
  method: "delete",
  tags,
  summary: "Delete an endpoint",
  operationId: "deleteEndpoint",
  description: "Permanently remove an endpoint from the system. Only endpoints belonging to the authenticated user can be deleted. This will also remove any related statistics and execution history. Returns 204 No Content on success with an empty response body.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Endpoint successfully deleted (no response body)",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Endpoint not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid UUID format for endpoint ID",
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
