// filepath: /Users/bcanfield/testapp/apps/api/src/resolvers/messages.ts
import {
  createMessage,
  deleteMessage,
  getMessages,
  getMessageById,
  getPagination,
  InsertMessagesSchema,
  MessageSchema,
  PaginationSchema,
  updateMessage,
  UpdateMessagesSchema,
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
      description: "Create a new message",
      responses: {
        201: {
          description: "Message created",
          content: { "application/json": { schema: resolver(MessageSchema) } },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("json", InsertMessagesSchema),
    async (c) => {
      const input = c.req.valid("json");
      const message = await createMessage(input);
      c.header("Location", `${c.req.path}/${message.id}`);
      return c.json(message, 201);
    }
  )
  .get(
    "/",
    describeRoute({
      description: "Get a paginated list of messages",
      responses: {
        200: {
          description: "List of messages",
          content: {
            "application/json": { schema: resolver(MessageSchema.array()) },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("query", PaginationSchema),
    async (c) => {
      const query = c.req.valid("query");
      const { page, limit } = getPagination(query);
      const messages = await getMessages({ page, limit });
      return c.json(messages);
    }
  )
  .get(
    "/:id",
    describeRoute({
      description: "Get a message by ID",
      responses: {
        200: {
          description: "Message details",
          content: { "application/json": { schema: resolver(MessageSchema) } },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const message = await getMessageById(id);
      if (!message) return notFoundResponse(c);
      return c.json(message);
    }
  )
  .put(
    "/:id",
    describeRoute({
      description: "Update a message by ID",
      responses: {
        200: {
          description: "Updated message details",
          content: { "application/json": { schema: resolver(MessageSchema) } },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    zValidator("json", UpdateMessagesSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const updated = await updateMessage(id, data);
      if (!updated) return notFoundResponse(c);
      return c.json(updated);
    }
  )
  .delete(
    "/:id",
    describeRoute({
      description: "Delete a message by ID",
      responses: {
        200: { description: "Deleted" },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deleteMessage(id);
      if (!deleted) return notFoundResponse(c);
      return c.json(undefined, 200);
    }
  );

export default app;
export type AppType = typeof route;
