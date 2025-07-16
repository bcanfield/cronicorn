// filepath: /Users/bcanfield/testapp/apps/api/src/resolvers/sessions.ts
import {
  createSession,
  deleteSession,
  getSessions,
  getSessionById,
  getPagination,
  InsertSessionsSchema,
  SessionSchema,
  PaginationSchema,
  updateSession,
  UpdateSessionsSchema,
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
      description: "Create a new session",
      responses: {
        201: {
          description: "Session created",
          content: {
            "application/json": {
              schema: resolver(SessionSchema),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("json", InsertSessionsSchema),
    async (c) => {
      const input = c.req.valid("json");
      const session = await createSession(input);
      c.header("Location", `${c.req.path}/${session.id}`);
      return c.json(session, 201);
    }
  )
  .get(
    "/",
    describeRoute({
      description: "Get a paginated list of sessions",
      responses: {
        200: {
          description: "List of sessions",
          content: {
            "application/json": {
              schema: resolver(SessionSchema.array()),
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
      const sessions = await getSessions({ page, limit });
      return c.json(sessions);
    }
  )
  .get(
    "/:id",
    describeRoute({
      description: "Get a session by ID",
      responses: {
        200: {
          description: "Session details",
          content: {
            "application/json": {
              schema: resolver(SessionSchema),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const session = await getSessionById(id);
      if (!session) return notFoundResponse(c);
      return c.json(session);
    }
  )
  .put(
    "/:id",
    describeRoute({
      description: "Update a session by ID",
      responses: {
        200: {
          description: "Updated session details",
          content: {
            "application/json": {
              schema: resolver(SessionSchema),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    zValidator("json", UpdateSessionsSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const updated = await updateSession(id, data);
      if (!updated) return notFoundResponse(c);
      return c.json(updated);
    }
  )
  .delete(
    "/:id",
    describeRoute({
      description: "Delete a session by ID",
      responses: {
        200: { description: "Deleted" },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deleteSession(id);
      if (!deleted) return notFoundResponse(c);
      return c.json(undefined, 200);
    }
  );

export default app;
export type AppType = typeof route;
