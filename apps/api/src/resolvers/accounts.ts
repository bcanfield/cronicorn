// filepath: /Users/bcanfield/testapp/apps/api/src/resolvers/accounts.ts
import {
  createAccount,
  deleteAccount,
  getAccounts,
  getAccountById,
  getPagination,
  InsertAccountsSchema,
  AccountSchema,
  PaginationSchema,
  updateAccount,
  UpdateAccountsSchema,
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
      description: "Create a new account",
      responses: {
        201: {
          description: "Account created",
          content: {
            "application/json": {
              schema: resolver(AccountSchema),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("json", InsertAccountsSchema),
    async (c) => {
      const input = c.req.valid("json");
      const account = await createAccount(input);
      c.header("Location", `${c.req.path}/${account.id}`);
      return c.json(account, 201);
    }
  )
  .get(
    "/",
    describeRoute({
      description: "Get a paginated list of accounts",
      responses: {
        200: {
          description: "List of accounts",
          content: {
            "application/json": {
              schema: resolver(AccountSchema.array()),
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
      const accounts = await getAccounts({ page, limit });
      return c.json(accounts);
    }
  )
  .get(
    "/:id",
    describeRoute({
      description: "Get an account by ID",
      responses: {
        200: {
          description: "Account details",
          content: {
            "application/json": {
              schema: resolver(AccountSchema),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const account = await getAccountById(id);
      if (!account) return notFoundResponse(c);
      return c.json(account);
    }
  )
  .put(
    "/:id",
    describeRoute({
      description: "Update an account by ID",
      responses: {
        200: {
          description: "Updated account details",
          content: {
            "application/json": {
              schema: resolver(AccountSchema),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    zValidator("json", UpdateAccountsSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const updated = await updateAccount(id, data);
      if (!updated) return notFoundResponse(c);
      return c.json(updated);
    }
  )
  .delete(
    "/:id",
    describeRoute({
      description: "Delete an account by ID",
      responses: {
        200: { description: "Deleted" },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deleteAccount(id);
      if (!deleted) return notFoundResponse(c);
      return c.json(undefined, 200);
    }
  );

export default app;
export type AppType = typeof route;
