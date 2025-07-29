import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { insertEndpointsSchema, listEndpointsSchema, patchEndpointsSchema, selectEndpointsSchema } from "@/api/db/schema/endpoints";
import { notFoundSchema } from "@/api/lib/constants";

const tags = ["Endpoints"];

const listResponseSchema = z.object({
    items: z.array(selectEndpointsSchema),
    hasNext: z.boolean(),
});

export const list = createRoute({
    path: "/endpoints",
    method: "get",
    tags,
    request: { query: listEndpointsSchema },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(listResponseSchema, "The paginated list of endpoints"),
    },
});

export const create = createRoute({
    path: "/endpoints",
    method: "post",
    tags,
    request: {
        body: jsonContentRequired(insertEndpointsSchema, "The endpoint to create"),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(selectEndpointsSchema, "The created endpoint"),
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
    request: {
        params: IdUUIDParamsSchema,
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(selectEndpointsSchema, "The requested endpoint"),
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
    request: {
        params: IdUUIDParamsSchema,
        body: jsonContentRequired(patchEndpointsSchema, "The endpoint updates"),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(selectEndpointsSchema, "The updated endpoint"),
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
    request: {
        params: IdUUIDParamsSchema,
    },
    responses: {
        [HttpStatusCodes.NO_CONTENT]: { description: "Endpoint deleted" },
        [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Endpoint not found"),
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
