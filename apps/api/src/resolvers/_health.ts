import { Hono } from "hono";

const app = new Hono();

const route = app.get("/health", async (c) => {
  return c.json({ status: "ok" });
});

export default app;
export type AppType = typeof route;
