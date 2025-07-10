import { Hono } from "hono";
import { handle as vercelHandle } from "hono/vercel";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { hc, type InferResponseType, type InferRequestType } from "hono/client";

const app = new Hono().basePath("/api/hono");

const schema = z.object({
	id: z.string(),
	title: z.string(),
});

type Todo = z.infer<typeof schema>;

const todos: Todo[] = [];

const route = app
	.post("/todo", zValidator("form", schema), (c) => {
		const todo = c.req.valid("form");
		todos.push(todo);
		return c.json({
			message: "created!",
		});
	})
	.get((c) => {
		return c.json({
			todos,
		});
	});
type RestApiType = typeof route;

export { vercelHandle, app, type RestApiType, hc, type InferResponseType, type InferRequestType };
