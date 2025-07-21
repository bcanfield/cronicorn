import { authHandler } from "@hono/auth-js";
import { OpenAPIHono } from "@hono/zod-openapi";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";

import { pinoLogger } from "@/api/middlewares/pino-logger";

import type { AppBindings, AppOpenAPI } from "./types";

import { BASE_PATH } from "./constants";
import createAuthConfig from "./create-auth-config";

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
}

export default function createApp() {
  const app = createRouter().basePath(BASE_PATH) as AppOpenAPI;
  app
    .use(
      "*",
      async (c, next) => {
        c.set("authConfig", createAuthConfig());
        return next();
      },
    )
    .use("/auth/*", authHandler())
    .notFound(notFound)
    .onError(onError);
  app.use(serveEmojiFavicon("📝"));
  app.use(pinoLogger());

  app.notFound(notFound);
  app.onError(onError);
  return app;
}

export function createTestApp<R extends AppOpenAPI>(router: R) {
  return createApp().route("/", router);
}
