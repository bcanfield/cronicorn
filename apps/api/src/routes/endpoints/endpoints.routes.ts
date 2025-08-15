import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { insertEndpointsSchema, listEndpointsSchema, patchEndpointsSchema, selectEndpointsSchema } from "@/api/db/schema/endpoints.js";
import { notFoundSchema } from "@/api/lib/constants.js";

const tags = ["Endpoints"];

const listResponseSchema = z.object({
  items: z.array(selectEndpointsSchema),
  hasNext: z.boolean(),
});

export const list = createRoute({
  path: "/endpoints",
  method: "get",
  tags,
  summary: "List Endpoints",
  description: "Retrieve a paginated list of endpoints with optional filtering by job ID, status, or other criteria.",
  request: { query: listEndpointsSchema },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(listResponseSchema, "The paginated list of endpoints"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      notFoundSchema,
      "Authentication required",
    ),

  },
});

export const create = createRoute({
  path: "/endpoints",
  method: "post",
  tags,
  summary: "Create Endpoint",
  description: "Create a new endpoint configuration for a job to interact with an external service or API. Includes URL, method, headers, and authentication details.",
  request: {
    body: jsonContentRequired(insertEndpointsSchema, "The endpoint to create"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectEndpointsSchema, "The created endpoint"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      notFoundSchema,
      "Authentication required",
    ),

    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Job not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertEndpointsSchema),
      "Validation error(s)",
    ),
  },
});

export const getOne = createRoute({
  path: "/endpoints/{id}",
  method: "get",
  tags,
  summary: "Get Endpoint",
  description: "Retrieve details for a specific endpoint by ID, including its configuration, usage statistics, and last execution status.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectEndpointsSchema, "The requested endpoint"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      notFoundSchema,
      "Authentication required",
    ),

    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Endpoint not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid id",
    ),
  },
});

export const patch = createRoute({
  path: "/endpoints/{id}",
  method: "patch",
  tags,
  summary: "Update Endpoint",
  description: "Modify an existing endpoint's configuration, such as changing the URL, method, headers, or authentication details.",
  request: {
    params: IdUUIDParamsSchema,
    body: jsonContentRequired(patchEndpointsSchema, "The endpoint updates"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectEndpointsSchema, "The updated endpoint"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      notFoundSchema,
      "Authentication required",
    ),

    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Endpoint not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchEndpointsSchema)
        .or(createErrorSchema(IdUUIDParamsSchema)),
      "Validation error(s)",
    ),
  },
});

export const remove = createRoute({
  path: "/endpoints/{id}",
  method: "delete",
  tags,
  summary: "Delete Endpoint",
  description: "Permanently remove an endpoint from the system. This will also remove any related statistics and execution history.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: { description: "Endpoint deleted" },
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      notFoundSchema,
      "Authentication required",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Endpoint not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid id",
    ),
  },
});

export const run = createRoute({
  path: "/endpoints/{id}/run",
  method: "post",
  tags,
  summary: "Run Endpoint",
  description: "Execute a request to the specified endpoint using its configured URL, HTTP method, and bearer token. Enforces request and response size limits.",
  request: {
    params: IdUUIDParamsSchema,
    body: jsonContent(
      z.object({
        requestBody: z.any().optional().describe("Optional request body to send with the request"),
      }),
      "Optional request body",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
        data: z.any().optional(),
        statusCode: z.number().optional(),
        responseTime: z.number().optional(),
        headers: z.record(z.string()).optional(),
        // Size limits information
        sizes: z.object({
          requestSize: z.number().optional().describe("Size of the request body in bytes"),
          responseSize: z.number().optional().describe("Size of the response body in bytes"),
          truncated: z.boolean().optional().describe("Whether the response was truncated due to size limits"),
        }).optional(),
      }),
      "The result of executing the endpoint request",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      notFoundSchema,
      "Authentication required",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Endpoint not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema)
        .or(z.object({
          success: z.literal(false),
          message: z.string().describe("Error message"),
          error: z.object({
            code: z.string().describe("Error code"),
            details: z.record(z.any()).optional().describe("Additional error details"),
          }),
        })),
      "Invalid id or request body exceeds size limits",
    ),
    413: jsonContent( // 413 PAYLOAD_TOO_LARGE
      z.object({
        success: z.literal(false),
        message: z.string().describe("Error message explaining the size limit violation"),
        error: z.object({
          code: z.literal("PAYLOAD_TOO_LARGE"),
          details: z.object({
            actualSize: z.number().describe("Actual size of the request body in bytes"),
            maxSize: z.number().describe("Maximum allowed size in bytes"),
          }),
        }),
      }),
      "Request body exceeds size limits",
    ),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type PatchRoute = typeof patch;
export type RemoveRoute = typeof remove;
export type RunRoute = typeof run;
