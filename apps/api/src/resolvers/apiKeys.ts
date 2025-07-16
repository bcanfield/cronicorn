// filepath: /Users/bcanfield/testapp/apps/api/src/resolvers/apiKeys.ts
import {
  createApiKey,
  deleteApiKey,
  getApiKeys,
  getApiKeyById,
  getPagination,
  InsertApiKeysSchema,
  ApiKeySchema,
  PaginationSchema,
  updateApiKey,
  UpdateApiKeysSchema,
} from "@cronicorn/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { zValidator } from "../zod-validation-wrapper";
import { errorResponses_400_and_404 } from "../error-responses";
import { notFoundResponse } from "../response-schemas";
import { IdSchema } from "../id-schema";

const app = new Hono();

// Create
const route = app
  .post(
    "/",
    describeRoute({
      description: "Create a new API key",
      responses: {
        201: {
          description: "API key created",
          content: { "application/json": { schema: resolver(ApiKeySchema) } },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("json", InsertApiKeysSchema),
    async (c) => {
      const input = c.req.valid("json");
      const key = await createApiKey(input);
      c.header("Location", `${c.req.path}/${key.id}`);
      return c.json(key, 201);
    }
  )
  .get(
    "/",
    describeRoute({
      description: "Get a paginated list of API keys",
      responses: {
        200: {
          description: "List of API keys",
          content: {
            "application/json": { schema: resolver(ApiKeySchema.array()) },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("query", PaginationSchema),
    async (c) => {
      const query = c.req.valid("query");
      const { page, limit } = getPagination(query);
      const keys = await getApiKeys({ page, limit });
      return c.json(keys);
    }
  )
  .get(
    "/:id",
    describeRoute({
      description: "Get an API key by ID",
      responses: {
        200: {
          description: "API key details",
          content: { "application/json": { schema: resolver(ApiKeySchema) } },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const key = await getApiKeyById(id);
      if (!key) return notFoundResponse(c);
      return c.json(key);
    }
  )
  .put(
    "/:id",
    describeRoute({
      description: "Update an API key by ID",
      responses: {
        200: {
          description: "Updated API key details",
          content: { "application/json": { schema: resolver(ApiKeySchema) } },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    zValidator("json", UpdateApiKeysSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const updated = await updateApiKey(id, data);
      if (!updated) return notFoundResponse(c);
      return c.json(updated);
    }
  )
  .delete(
    "/:id",
    describeRoute({
      description: "Delete an API key by ID",
      responses: {
        200: { description: "Deleted" },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deleteApiKey(id);
      if (!deleted) return notFoundResponse(c);
      return c.json(undefined, 200);
    }
  );

export default app;
export type AppType = typeof route;
