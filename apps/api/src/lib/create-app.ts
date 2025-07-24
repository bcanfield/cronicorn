import { authHandler, verifyAuth } from "@hono/auth-js";
import { OpenAPIHono } from "@hono/zod-openapi";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";

import env from "@/api/env";
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
    .use("/auth/*", authHandler());

  // In non-production (dev/test), allow bypassing auth
  if (env.NODE_ENV === "production" || !env.FAKE_AUTH) {
    app.use("*", verifyAuth());
  }
  else {
    app.use("*", async (c, next) => {
      // @ts-expect-error: TODO: FIX THIS BY ADDING THIS TYPE MANUALLY TO THE CONTEXT
      c.set("authUser", {
        id: "dev-user",
        name: "Dev User",
        email: "devuser@example.com",
      });
      return next();
    });
  }
  app.notFound(notFound)
    .onError(onError)
    .use(serveEmojiFavicon("📝"))
    .use(pinoLogger());

  return app;
}

export function createTestApp<R extends AppOpenAPI>(router: R) {
  return createApp().route("/", router);
}
