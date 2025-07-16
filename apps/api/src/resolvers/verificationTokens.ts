// filepath: /Users/bcanfield/testapp/apps/api/src/resolvers/verificationTokens.ts
import {
  createVerificationToken,
  deleteVerificationToken,
  getVerificationTokens,
  getVerificationToken,
  updateVerificationToken,
  InsertVerificationTokensSchema,
  VerificationTokenSchema,
  UpdateVerificationTokensSchema,
  PaginationSchema,
  getPagination,
} from "@cronicorn/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { zValidator } from "../zod-validation-wrapper";
import { errorResponses_400_and_404 } from "../error-responses";
import { notFoundResponse } from "../response-schemas";
import z from "zod";

const ParamSchema = z.object({ identifier: z.string(), token: z.string() });
const app = new Hono();

// Create
const route = app
  .post(
    "/",
    describeRoute({
      description: "Create a new verification token",
      responses: {
        201: {
          description: "Token created",
          content: {
            "application/json": { schema: resolver(VerificationTokenSchema) },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("json", InsertVerificationTokensSchema),
    async (c) => {
      const input = c.req.valid("json");
      const vt = await createVerificationToken(input);
      c.header("Location", `${c.req.path}/${vt.identifier}/${vt.token}`);
      return c.json(vt, 201);
    }
  )
  .get(
    "/",
    describeRoute({
      description: "Get a paginated list of verification tokens",
      responses: {
        200: {
          description: "List of tokens",
          content: {
            "application/json": {
              schema: resolver(VerificationTokenSchema.array()),
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
      const list = await getVerificationTokens({ page, limit });
      return c.json(list);
    }
  )
  .get(
    "/:identifier/:token",
    describeRoute({
      description: "Get a verification token by identifier and token",
      responses: {
        200: {
          description: "Token details",
          content: {
            "application/json": { schema: resolver(VerificationTokenSchema) },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", ParamSchema),
    async (c) => {
      const { identifier, token } = c.req.valid("param");
      const vt = await getVerificationToken(identifier, token);
      if (!vt) return notFoundResponse(c);
      return c.json(vt);
    }
  )
  .put(
    "/:identifier/:token",
    describeRoute({
      description: "Update a verification token",
      responses: {
        200: {
          description: "Updated token",
          content: {
            "application/json": { schema: resolver(VerificationTokenSchema) },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", ParamSchema),
    zValidator("json", UpdateVerificationTokensSchema),
    async (c) => {
      const { identifier, token } = c.req.valid("param");
      const data = c.req.valid("json");
      const updated = await updateVerificationToken(identifier, token, data);
      if (!updated) return notFoundResponse(c);
      return c.json(updated);
    }
  )
  .delete(
    "/:identifier/:token",
    describeRoute({
      description: "Delete a verification token",
      responses: {
        200: { description: "Deleted" },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", ParamSchema),
    async (c) => {
      const { identifier, token } = c.req.valid("param");
      const deleted = await deleteVerificationToken(identifier, token);
      if (!deleted) return notFoundResponse(c);
      return c.json(undefined, 200);
    }
  );

export default app;
export type AppType = typeof route;
