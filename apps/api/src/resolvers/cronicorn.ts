// filepath: /Users/bcanfield/testapp/apps/api/src/resolvers/messages.ts
import {
  getCronicornMessages,
  getPagination,
  MessageSchema,
  PaginationSchema,
} from "@cronicorn/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { errorResponses_400_and_404 } from "../error-responses";
import { zValidator } from "../zod-validation-wrapper";
import { modelMessageSchema } from "../language-model-v2-utils/language-model-v2-schemas";

const app = new Hono();

// ─── Create ─────────────────────────────────────────────────────────────────
const route = app.get(
  "/",
  describeRoute({
    description: "Get a paginated list of cronicorn messages",
    responses: {
      200: {
        description: "List of messages",
        // content: {
        //   "application/json": { schema: resolver(modelMessageSchema.array()) },
        // },
      },
      ...errorResponses_400_and_404,
    },
  }),
  zValidator("query", PaginationSchema),
  async (c) => {
    const query = c.req.valid("query");
    const { page, limit } = getPagination(query);
    const messages = await getCronicornMessages({ page, limit });
    const parsedMessages = messages.flatMap((msg) => {
      const result = modelMessageSchema.safeParse({
        role: msg.role,
        content: msg.content,
      });
      if (result.success) {
        return result.data;
      } else {
        const issues = result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        console.error(`Failed to parse message ${msg.id}: ${issues}`);
        return [];
      }

      //   return modelMessageSchema.parse({
      //     id: msg.id,
      //     content: msg.content,
      //     createdAt: msg.createdAt,
      //     updatedAt: msg.updatedAt,
      //   });
    });
    // const testTypeMessage: { id: string }[] = messages.map((msg) => ({
    //   id: msg.id,
    // }));
    return c.json(parsedMessages);
  }
);

export default app;
export type AppType = typeof route;
