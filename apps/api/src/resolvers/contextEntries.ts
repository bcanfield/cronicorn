// filepath: /Users/bcanfield/testapp/apps/api/src/resolvers/contextEntries.ts
import {
  createContextEntry,
  deleteContextEntry,
  getContextEntries,
  getContextEntryById,
  getPagination,
  InsertContextEntriesSchema,
  ContextEntrySchema,
  PaginationSchema,
  updateContextEntry,
  UpdateContextEntriesSchema,
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
      description: "Create a new context entry",
      responses: {
        201: {
          description: "Context entry created",
          content: {
            "application/json": { schema: resolver(ContextEntrySchema) },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("json", InsertContextEntriesSchema),
    async (c) => {
      const input = c.req.valid("json");
      const entry = await createContextEntry(input);
      c.header("Location", `${c.req.path}/${entry.id}`);
      return c.json(entry, 201);
    }
  )
  .get(
    "/",
    describeRoute({
      description: "Get a paginated list of context entries",
      responses: {
        200: {
          description: "List of context entries",
          content: {
            "application/json": {
              schema: resolver(ContextEntrySchema.array()),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("query", PaginationSchema),
    async (c) => {
      const query = c.req.valid("query");
      const { page, limit } = getPagination(query);
      const entries = await getContextEntries({ page, limit });
      return c.json(entries);
    }
  )
  .get(
    "/:id",
    describeRoute({
      description: "Get a context entry by ID",
      responses: {
        200: {
          description: "Context entry details",
          content: {
            "application/json": { schema: resolver(ContextEntrySchema) },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const entry = await getContextEntryById(id);
      if (!entry) return notFoundResponse(c);
      return c.json(entry);
    }
  )
  .put(
    "/:id",
    describeRoute({
      description: "Update a context entry by ID",
      responses: {
        200: {
          description: "Updated context entry details",
          content: {
            "application/json": { schema: resolver(ContextEntrySchema) },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    zValidator("json", UpdateContextEntriesSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const updated = await updateContextEntry(id, data);
      if (!updated) return notFoundResponse(c);
      return c.json(updated);
    }
  )
  .delete(
    "/:id",
    describeRoute({
      description: "Delete a context entry by ID",
      responses: {
        200: { description: "Deleted" },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deleteContextEntry(id);
      if (!deleted) return notFoundResponse(c);
      return c.json(undefined, 200);
    }
  );

export default app;
export type AppType = typeof route;
