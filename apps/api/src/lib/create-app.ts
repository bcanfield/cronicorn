import type { AuthUser } from "@hono/auth-js";

import { authHandler, verifyAuth } from "@hono/auth-js";
import { OpenAPIHono } from "@hono/zod-openapi";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";

import env from "@/api/env";
import { DEV_USER } from "@/api/lib/dev-user";
import { apiKeyAuth } from "@/api/middlewares/api-key-auth";
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

  // Skip auth for public routes like API documentation
  app.use("*", async (c, next) => {
    // Skip authentication for OpenAPI reference routes
    const path = c.req.path;
    if (path === "/api/reference" || path === "/api/doc") {
      return next();
    }

    // Continue with regular auth flow
    return next();
  });

  // First try API key authentication
  app.use("*", async (c, next) => {
    // Skip for documentation routes
    const path = c.req.path;
    if (path === "/api/reference" || path === "/api/doc") {
      return next();
    }
    return apiKeyAuth()(c, next);
  });

  // If API key auth didn't set authUser, fallback to standard auth
  if (env.NODE_ENV === "production" || !env.FAKE_AUTH) {
    console.warn("Using standard auth middleware");
    app.use("*", async (c, next) => {
      // Skip for documentation routes
      const path = c.req.path;
      if (path === "/api/reference" || path === "/api/doc") {
        return next();
      }

      // If API key auth has already set authUser, skip verifyAuth
      if (c.get("authUser")) {
        console.warn(`Standard auth skipped - user already authenticated via API key: ${c.get("authUser")?.user?.id}`);
        return next();
      }

      try {
        return verifyAuth()(c, next);
      }
      catch (error) {
        console.warn(`Auth error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
  }
  else {
    app.use("*", async (c, next) => {
      // Skip for documentation routes
      const path = c.req.path;
      if (path === "/api/reference" || path === "/api/doc") {
        return next();
      }

      // console.warn("Using dev auth middleware");
      // Only set dev user if authUser wasn't already set by API key auth
      if (!c.get("authUser")) {
        const authUser: AuthUser = {
          user: DEV_USER,
          session: {
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toDateString(), // 7 days
          },
        };
        c.set("authUser", authUser);
      }
      return next();
    });
  }

  // Debug middleware - check if authUser is present after all auth middleware
  app.use("*", async (c, next) => {
    // Skip for documentation routes
    const path = c.req.path;
    if (path === "/api/reference" || path === "/api/doc") {
      return next();
    }

    const authUser = c.get("authUser");
    const apiKey = c.req.header("X-API-Key");

    // If API Key was provided but no authUser is set, something went wrong
    if (apiKey && !authUser) {
      console.warn(`Warning: API key provided but no authUser set for path ${path}`);
    }

    return next();
  });

  app.notFound(notFound)
    .onError(onError)
    .use(serveEmojiFavicon("📝"))
    .use(pinoLogger());

  return app;
}

export function createTestApp<R extends AppOpenAPI>(router: R) {
  return createApp().route("/", router);
}
