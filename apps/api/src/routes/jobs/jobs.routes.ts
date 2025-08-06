import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

// import { listJobsQuerySchema } from "@/api/db/query-schemas";
import { insertJobsSchema, listJobsSchema, patchJobsSchema, selectJobsSchema } from "@/api/db/schema";
import { notFoundSchema } from "@/api/lib/constants";

const tags = ["Jobs"];

// Composite query schema: pagination, sorting, filtering

/**
 * Response schema for paginated job list
 *
 * Returns:
 * - items: Array of job objects matching the query criteria
 * - hasNext: Boolean indicating if there are more results available (for pagination)
 */
const listResponseSchema = z.object({
  items: z.array(selectJobsSchema).describe("Array of job objects"),
  hasNext: z.boolean().describe("Indicates if there are more results available for pagination"),
});

export const list = createRoute({
  path: "/jobs",
  method: "get",
  tags,
  summary: "List jobs",
  operationId: "listJobs",
  security: [{ bearerAuth: [] }],
  request: { query: listJobsSchema },
  description: "Lists all jobs with pagination, sorting, and filtering options. Returns only jobs belonging to the authenticated user. Supports searching by job definition text and sorting by various fields.",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      listResponseSchema,
      "The paginated list of jobs with a flag indicating if more results are available",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const create = createRoute({
  path: "/jobs",
  method: "post",
  tags,
  summary: "Create a new job",
  operationId: "createJob",
  security: [{ bearerAuth: [] }],
  description: "Creates a new job for the authenticated user. Requires at minimum a natural language definition of the job.",
  request: {
    body: jsonContentRequired(
      insertJobsSchema,
      "The job to create",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectJobsSchema,
      "The created job with its assigned ID and metadata",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertJobsSchema),
      "Validation error(s) in the request body",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const getOne = createRoute({
  path: "/jobs/{id}",
  method: "get",
  tags,
  summary: "Get a specific job",
  operationId: "getJob",
  security: [{ bearerAuth: [] }],
  description: "Retrieves a specific job by its ID. Only jobs belonging to the authenticated user can be retrieved.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectJobsSchema,
      "The requested job's complete details",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid UUID format for job ID",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const patch = createRoute({
  path: "/jobs/{id}",
  method: "patch",
  tags,
  summary: "Update a job",
  operationId: "updateJob",
  security: [{ bearerAuth: [] }],
  description: "Updates an existing job with partial data. Only jobs belonging to the authenticated user can be modified. At least one field must be provided for update.",
  request: {
    params: IdUUIDParamsSchema,
    body: jsonContentRequired(
      patchJobsSchema,
      "The job fields to update",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectJobsSchema,
      "The complete updated job after changes",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchJobsSchema).or(createErrorSchema(IdUUIDParamsSchema)),
      "Validation error(s) in request body or invalid UUID format",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Authentication required",
    ),
  },
});

export const remove = createRoute({
  path: "/jobs/{id}",
  method: "delete",
  tags,
  summary: "Delete a job",
  operationId: "deleteJob",
  security: [{ bearerAuth: [] }],
  description: "Permanently deletes a job. Only jobs belonging to the authenticated user can be deleted. Returns 204 No Content on success with an empty response body.",
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Job successfully deleted (no response body)",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Job not found or does not belong to the authenticated user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid UUID format for job ID",
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
