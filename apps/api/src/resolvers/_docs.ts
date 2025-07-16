import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";

const app = new Hono();

const route = app.get(
  "/",
  Scalar({
    // theme: "laserwave",
    url: "/openapi",
  })
);

export default app;
export type AppType = typeof route;
