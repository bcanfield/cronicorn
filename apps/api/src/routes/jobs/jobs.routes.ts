import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { insertJobsSchema, patchJobsSchema, selectJobsSchema } from "@/api/db/schema";
import { notFoundSchema } from "@/api/lib/constants";

const tags = ["Jobs"];

export const list = createRoute({
    path: "/jobs",
    method: "get",
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.array(selectJobsSchema),
            "The list of jobs",
        ),
    },
});

export const create = createRoute({
    path: "/jobs",
    method: "post",
    tags,
    request: {
        body: jsonContentRequired(
            insertJobsSchema,
            "The job to create",
        ),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            selectJobsSchema,
            "The created job",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(insertJobsSchema),
            "Validation error(s)",
        ),
    },
});

export const getOne = createRoute({
    path: "/jobs/{id}",
    method: "get",
    tags,
    request: {
        params: IdUUIDParamsSchema,
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            selectJobsSchema,
            "The requested job",
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "Job not found",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(IdUUIDParamsSchema),
            "Invalid id",
        ),
    },
});

export const patch = createRoute({
    path: "/jobs/{id}",
    method: "patch",
    tags,
    request: {
        params: IdUUIDParamsSchema,
        body: jsonContentRequired(
            patchJobsSchema,
            "The job updates",
        ),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            selectJobsSchema,
            "The updated job",
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "Job not found",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(patchJobsSchema).or(createErrorSchema(IdUUIDParamsSchema)),
            "Validation error(s)",
        ),
    },
});

export const remove = createRoute({
    path: "/jobs/{id}",
    method: "delete",
    tags,
    request: {
        params: IdUUIDParamsSchema,
    },
    responses: {
        [HttpStatusCodes.NO_CONTENT]: { description: "Job deleted" },
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "Job not found",
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
export type RemoveRoute = typeof remove;
