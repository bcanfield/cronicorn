// filepath: /Users/bcanfield/testapp/apps/api/src/resolvers/endpoints.ts
import {
  createEndpoint,
  deleteEndpoint,
  getEndpoints,
  getEndpointById,
  getPagination,
  InsertEndpointsSchema,
  EndpointSchema,
  PaginationSchema,
  updateEndpoint,
  UpdateEndpointsSchema,
} from "@cronicorn/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { zValidator } from "../zod-validation-wrapper";
import { errorResponses_400_and_404 } from "../error-responses";
import { notFoundResponse } from "../response-schemas";
import { IdSchema } from "../id-schema";

const app = new Hono();

// ─── Create ─────────────────────────────────────────────────────────────────
const route = app
  .post(
    "/",
    describeRoute({
      description: "Create a new endpoint",
      responses: {
        201: {
          description: "Endpoint created",
          content: { "application/json": { schema: resolver(EndpointSchema) } },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("json", InsertEndpointsSchema),
    async (c) => {
      const input = c.req.valid("json");
      const endpoint = await createEndpoint(input);
      c.header("Location", `${c.req.path}/${endpoint.id}`);
      return c.json(endpoint, 201);
    }
  )
  .get(
    "/",
    describeRoute({
      description: "Get a paginated list of endpoints",
      responses: {
        200: {
          description: "List of endpoints",
          content: {
            "application/json": { schema: resolver(EndpointSchema.array()) },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("query", PaginationSchema),
    async (c) => {
      const query = c.req.valid("query");
      const { page, limit } = getPagination(query);
      const endpoints = await getEndpoints({ page, limit });
      return c.json(endpoints);
    }
  )
  .get(
    "/:id",
    describeRoute({
      description: "Get an endpoint by ID",
      responses: {
        200: {
          description: "Endpoint details",
          content: { "application/json": { schema: resolver(EndpointSchema) } },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const endpoint = await getEndpointById(id);
      if (!endpoint) return notFoundResponse(c);
      return c.json(endpoint);
    }
  )
  .put(
    "/:id",
    describeRoute({
      description: "Update an endpoint by ID",
      responses: {
        200: {
          description: "Updated endpoint details",
          content: { "application/json": { schema: resolver(EndpointSchema) } },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    zValidator("json", UpdateEndpointsSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const updated = await updateEndpoint(id, data);
      if (!updated) return notFoundResponse(c);
      return c.json(updated);
    }
  )
  .delete(
    "/:id",
    describeRoute({
      description: "Delete an endpoint by ID",
      responses: {
        200: { description: "Deleted" },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deleteEndpoint(id);
      if (!deleted) return notFoundResponse(c);
      return c.json(undefined, 200);
    }
  );

export default app;
export type AppType = typeof route;
