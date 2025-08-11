import type { AuthUser } from "@hono/auth-js";

import { authHandler, verifyAuth } from "@hono/auth-js";
import { OpenAPIHono } from "@hono/zod-openapi";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";

import env from "@/api/env";
import { logAuthDebug, logAuthError, logAuthInfo, logAuthWarn } from "@/api/lib/auth-logger";
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
  logAuthInfo("", "🚀 Creating API application");
  const app = createRouter().basePath(BASE_PATH) as AppOpenAPI;

  app
    .use(
      "*",
      async (c, next) => {
        const path = c.req.path;
        logAuthDebug(path, "📝 [Request] Incoming request", {
          method: c.req.method,
          headers: Object.fromEntries(
            Object.entries(c.req.header())
              .filter(([key]) => !["cookie", "authorization"].includes(key.toLowerCase())),
          ),
        });

        c.set("authConfig", createAuthConfig());
        return next();
      },
    )
    .use("/auth/*", authHandler());

  // Create a common function for checking public routes
  const isPublicRoute = (path: string) => {
    const publicPaths = ["/api/reference", "/api/doc", "/api/health", "/api/auth/session"];
    const result = publicPaths.includes(path);
    logAuthDebug(path, `🔍 [Route Check] IsPublic: ${result}`);
    return result;
  };

  // First handle public routes with no auth needed
  app.use("*", async (c, next) => {
    const path = c.req.path;
    if (isPublicRoute(path)) {
      // Skip authentication for public routes
      logAuthDebug(path, "🔓 [Public Route] Skipping auth");
      return next();
    }
    logAuthDebug(path, "🔒 [Protected Route] Continuing auth chain");
    return next();
  });

  // Then try API key authentication
  app.use("*", async (c, next) => {
    const path = c.req.path;
    // Skip for already-exempted public routes
    if (isPublicRoute(path)) {
      logAuthDebug(path, "🔑 [API Key Auth] Skipping for public route");
      return next();
    }

    // Check if API key is present in the request
    const apiKey = c.req.header("X-API-Key");
    logAuthDebug(path, "🔑 [API Key Auth] Checking", { hasApiKey: !!apiKey });

    try {
      // Try API key auth
      logAuthDebug(path, "🔑 [API Key Auth] Attempting authentication");
      const result = await apiKeyAuth()(c, next);

      // Check if API key auth succeeded
      const authUser = c.get("authUser");
      if (authUser) {
        logAuthInfo(path, "✅ [API Key Auth] Success", { userId: authUser.user?.id });
      }

      return result;
    }
    catch (error) {
      // If API key auth fails, continue to next middleware
      const err = error as Error;
      logAuthWarn(path, "❌ [API Key Auth] Failed", {
        error: err.message,
        stack: err.stack,
      });
      logAuthDebug(path, "➡️ [API Key Auth] Continuing to session auth");
      return next();
    }
  });

  // Then fallback to session auth
  if (env.NODE_ENV === "production" || !env.FAKE_AUTH) {
    logAuthInfo("", "🔒 [Session Auth] Using standard auth middleware in PRODUCTION mode");
    app.use("*", async (c, next) => {
      const path = c.req.path;
      const isApiKeyAuth = !!c.req.header("X-API-Key");
      const isSessionRoute = path.startsWith("/api/auth/");
      const hasAuthUser = !!c.get("authUser");

      logAuthDebug(path, "🔒 [Session Auth] Processing request", {
        isApiKeyAuth,
        isSessionRoute,
        hasAuthUser,
      });

      // Skip for public routes or if already authenticated
      if (isPublicRoute(path)) {
        logAuthDebug(path, "🔒 [Session Auth] Skipping for public route");
        return next();
      }

      if (c.get("authUser")) {
        logAuthDebug(path, "✅ [Session Auth] Already authenticated via API key - skipping session auth");
        return next();
      }

      try {
        logAuthDebug(path, "🔒 [Session Auth] Attempting session authentication");
        const authCookies = c.req.header("cookie");
        if (authCookies) {
          logAuthDebug(path, "🍪 [Cookies] Auth cookies present", {
            cookieLength: authCookies.length,
            cookieNames: authCookies.split(";").map(c => c.trim().split("=")[0]),
          });
        }
        else {
          logAuthDebug(path, "🍪 [Cookies] No cookies present");
        }

        const result = await verifyAuth()(c, next);

        // Check if session auth succeeded
        const authUser = c.get("authUser");
        if (authUser) {
          logAuthInfo(path, "✅ [Session Auth] Success", { userId: authUser.user?.id });
        }
        else {
          logAuthDebug(path, "❓ [Session Auth] No user after verifyAuth (may continue in next middleware)");
        }

        return result;
      }
      catch (error) {
        // Special handling for /api/auth/session - allow unauthenticated
        if (path === "/api/auth/session") {
          logAuthInfo(path, "🔓 [Session Auth] Allowing unauthenticated /api/auth/session request");
          return next();
        }

        logAuthError(path, "❌ [Session Auth] Error", error as Error);
        throw error;
      }
    });
  }
  else {
    // Development mode with fake auth
    logAuthWarn("", "👨‍💻 [Dev Auth] Using DEV auth middleware");
    app.use("*", async (c, next) => {
      const path = c.req.path;
      const hasAuthUser = !!c.get("authUser");

      logAuthDebug(path, "👨‍💻 [Dev Auth] Processing request", { hasAuthUser });

      // Skip for public routes or if already authenticated
      if (isPublicRoute(path)) {
        logAuthDebug(path, "👨‍💻 [Dev Auth] Skipping for public route");
        return next();
      }

      if (c.get("authUser")) {
        logAuthDebug(path, "👨‍💻 [Dev Auth] Already authenticated via API key - skipping dev auth");
        return next();
      }

      // Set dev user
      const authUser: AuthUser = {
        user: DEV_USER,
        session: {
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toDateString(), // 7 days
        },
      };
      c.set("authUser", authUser);
      logAuthInfo(path, "👨‍💻 [Dev Auth] Set dev user", { userId: DEV_USER.id });
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
    const authHeader = c.req.header("authorization");
    const hasCookies = !!c.req.header("cookie");

    // Final auth status check
    logAuthDebug(path, "🔍 [Auth Summary]", {
      hasAuthUser: !!authUser,
      hasApiKey: !!apiKey,
      hasAuthHeader: !!authHeader,
      hasCookies,
    });

    if (authUser) {
      logAuthInfo(path, "✅ [Auth Summary] Authentication successful", {
        userId: authUser.user?.id,
      });
    }

    // If API Key was provided but no authUser is set, something went wrong
    if (apiKey && !authUser) {
      logAuthError(
        path,
        "⚠️ [Auth Error] API key provided but no authUser set",
      );
    }

    // If we have neither API key nor session, and it's not a public route
    if (!authUser && !isPublicRoute(path)) {
      logAuthWarn(path, "⚠️ [Auth Warning] No authentication for non-public path");
    }

    return next();
  });

  // Custom error handler with detailed logging
  const customErrorHandler = async (err: Error, c: any) => {
    const path = c.req.path;

    logAuthError(path, "❌ [Error] Request processing failed", err, {
      additionalInfo: {
        method: c.req.method,
        headers: Object.fromEntries(
          Object.entries(c.req.header())
            .filter(([key]) => !["cookie", "authorization"].includes(key.toLowerCase())),
        ),
      },
    });

    // Continue with default error handler
    return onError(err, c);
  };

  app.notFound((c) => {
    const path = c.req.path;
    logAuthWarn(path, "🔍 [Not Found] Route not found", {
      method: c.req.method,
      path,
    });
    return notFound(c);
  })
    .onError(customErrorHandler)
    .use(serveEmojiFavicon("📝"))
    .use(pinoLogger());

  logAuthInfo("", "🚀 API application created and configured");
  return app;
}

export function createTestApp<R extends AppOpenAPI>(router: R) {
  return createApp().route("/", router);
}
