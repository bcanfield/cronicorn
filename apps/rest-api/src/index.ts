import { Hono } from "hono";
import { handle as vercelHandle } from "hono/vercel";

const app = new Hono().basePath("/api/hono");

app.get("/hello", (c) => {
	return c.json({
		ok: true,
		message: "Hello Hono!",
	});
});

export { vercelHandle, app };
