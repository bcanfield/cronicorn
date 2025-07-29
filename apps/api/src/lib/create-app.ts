import type { AuthUser } from "@hono/auth-js";

import { authHandler, verifyAuth } from "@hono/auth-js";
import { OpenAPIHono } from "@hono/zod-openapi";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";

import env from "@/api/env";
import { DEV_USER } from "@/api/lib/dev-user";
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

  // Bypass authentication in non-production environments (including test)
  if (env.NODE_ENV === "production" || !env.FAKE_AUTH) {
    app.use("*", verifyAuth());
  }
  else {
    app.use("*", async (c, next) => {
      const authUser: AuthUser = {
        user: DEV_USER,
        session: {
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toDateString(), // 7 days
        },
      };
      c.set("authUser", authUser);
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
