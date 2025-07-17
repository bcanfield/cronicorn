import {
  createUser,
  deleteUser,
  getPagination,
  getUserById,
  getUsers,
  InsertUsersSchema,
  PaginationSchema,
  updateUser,
  UpdateUsersSchema,
  UserSchema,
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
      description: "Create a new user",
      responses: {
        201: {
          description: "User created",
          content: {
            "application/json": {
              schema: resolver(UserSchema),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("json", InsertUsersSchema),
    async (c) => {
      const input = c.req.valid("json");
      const user = await createUser(input);
      c.header("Location", `${c.req.path}/${user.id}`);
      return c.json(user, 201);
    }
  )
  .get(
    "/",
    describeRoute({
      description: "Get a paginated list of users",
      responses: {
        200: {
          description: "List of users",
          content: {
            "application/json": {
              schema: resolver(UserSchema.array()),
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
      console.log("GET USERS: page:", page, "limit:", limit);
      const users = await getUsers({ page, limit });
      console.log("GET USERS 2:", users);
      return c.json(users);
    }
  )
  .get(
    "/:id",
    describeRoute({
      description: "Get a user by ID",
      responses: {
        200: {
          description: "User details",
          content: {
            "application/json": {
              schema: resolver(UserSchema),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const user = await getUserById(id);
      if (!user) return notFoundResponse(c);
      return c.json(user);
    }
  )
  .put(
    "/:id",
    describeRoute({
      description: "Update a user by ID",
      responses: {
        200: {
          description: "Updated user details",
          content: {
            "application/json": {
              schema: resolver(UserSchema),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    zValidator("json", UpdateUsersSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const updated = await updateUser(id, data);
      if (!updated) return notFoundResponse(c);
      return c.json(updated);
    }
  )
  .delete(
    "/:id",
    describeRoute({
      description: "Delete a user by ID",
      responses: {
        200: { description: "Deleted" },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deleteUser(id);
      console.log("Deleted user:", deleted);
      if (!deleted) return notFoundResponse(c);
      return c.json(undefined, 200);
    }
  );

export default app;
export type AppType = typeof route;
