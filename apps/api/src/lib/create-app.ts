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
  console.warn("🚀 Creating API application");
  const app = createRouter().basePath(BASE_PATH) as AppOpenAPI;
  app
    .use(
      "*",
      async (c, next) => {
        console.warn(`📝 [Request] ${c.req.method} ${c.req.path}`);
        console.warn(`📝 [Headers] ${JSON.stringify(Object.fromEntries(
          Object.entries(c.req.header())
            .filter(([key]) => !["cookie", "authorization"].includes(key.toLowerCase()))
        ))}`);
        c.set("authConfig", createAuthConfig());
        return next();
      },
    )
    .use("/auth/*", authHandler());

  // Create a common function for checking public routes
  const isPublicRoute = (path: string) => {
    const publicPaths = ["/api/reference", "/api/doc", "/api/health", "/api/auth/session"];
    const result = publicPaths.includes(path);
    console.warn(`🔍 [Route Check] Path: ${path}, IsPublic: ${result}`);
    return result;
  };

  // First handle public routes with no auth needed
  app.use("*", async (c, next) => {
    const path = c.req.path;
    if (isPublicRoute(path)) {
      // Skip authentication for public routes
      console.warn(`🔓 [Public Route] Skipping auth for ${path}`);
      return next();
    }
    console.warn(`🔒 [Protected Route] Continuing auth chain for ${path}`);
    return next();
  });

  // Then try API key authentication
  app.use("*", async (c, next) => {
    const path = c.req.path;
    // Skip for already-exempted public routes
    if (isPublicRoute(path)) {
      console.warn(`🔑 [API Key Auth] Skipping for public route: ${path}`);
      return next();
    }
    
    // Check if API key is present in the request
    const apiKey = c.req.header("X-API-Key");
    console.warn(`🔑 [API Key Auth] API Key present: ${!!apiKey}, Path: ${path}`);
    
    try {
      // Try API key auth
      console.warn(`🔑 [API Key Auth] Attempting API key authentication for path: ${path}`);
      const result = await apiKeyAuth()(c, next);
      
      // Check if API key auth succeeded
      const authUser = c.get("authUser");
      if (authUser) {
        console.warn(`✅ [API Key Auth] Success - User ID: ${authUser.user?.id}, Path: ${path}`);
      }
      
      return result;
    }
    catch (error) {
      // If API key auth fails, continue to next middleware
      console.warn(`❌ [API Key Auth] Failed for ${path}: ${error instanceof Error ? error.message : String(error)}`);
      console.warn(`➡️ [API Key Auth] Continuing to session auth for path: ${path}`);
      return next();
    }
  });

  // Then fallback to session auth
  if (env.NODE_ENV === "production" || !env.FAKE_AUTH) {
    console.warn("🔒 [Session Auth] Using standard auth middleware in PRODUCTION mode");
    app.use("*", async (c, next) => {
      const path = c.req.path;
      const isApiKeyAuth = !!c.req.header("X-API-Key");
      const isSessionRoute = path.startsWith("/api/auth/");
      const hasAuthUser = !!c.get("authUser");
      
      console.warn(`🔒 [Session Auth] Path: ${path}, IsApiKey: ${isApiKeyAuth}, IsSessionRoute: ${isSessionRoute}, HasAuthUser: ${hasAuthUser}`);

      // Skip for public routes or if already authenticated
      if (isPublicRoute(path)) {
        console.warn(`🔒 [Session Auth] Skipping for public route: ${path}`);
        return next();
      }
      
      if (c.get("authUser")) {
        console.warn(`✅ [Session Auth] Already authenticated via API key - skipping session auth for path: ${path}`);
        return next();
      }

      try {
        console.warn(`🔒 [Session Auth] Attempting session authentication for path: ${path}`);
        const authCookies = c.req.header("cookie");
        if (authCookies) {
          console.warn(`🍪 [Cookies] Auth cookies present for path ${path}. Cookie length: ${authCookies.length}`);
        } else {
          console.warn(`🍪 [Cookies] No cookies present for path ${path}`);
        }
        
        const result = await verifyAuth()(c, next);
        
        // Check if session auth succeeded
        const authUser = c.get("authUser");
        if (authUser) {
          console.warn(`✅ [Session Auth] Success - User ID: ${authUser.user?.id}, Path: ${path}`);
        }
        
        return result;
      }
      catch (error) {
        // Special handling for /api/auth/session - allow unauthenticated
        if (path === "/api/auth/session") {
          console.warn(`🔓 [Session Auth] Allowing unauthenticated /api/auth/session request`);
          return next();
        }

        console.warn(`❌ [Session Auth] Error: ${error instanceof Error ? error.message : String(error)}`);
        console.warn(`❌ [Session Auth] Stack: ${error instanceof Error && error.stack ? error.stack : 'No stack trace'}`);
        throw error;
      }
    });
  }
  else {
    // Development mode with fake auth
    console.warn("👨‍💻 [Dev Auth] Using DEV auth middleware");
    app.use("*", async (c, next) => {
      const path = c.req.path;
      const hasAuthUser = !!c.get("authUser");
      
      console.warn(`👨‍💻 [Dev Auth] Path: ${path}, HasAuthUser: ${hasAuthUser}`);

      // Skip for public routes or if already authenticated
      if (isPublicRoute(path)) {
        console.warn(`👨‍💻 [Dev Auth] Skipping for public route: ${path}`);
        return next();
      }
      
      if (c.get("authUser")) {
        console.warn(`👨‍💻 [Dev Auth] Already authenticated via API key - skipping dev auth for path: ${path}`);
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
      console.warn(`👨‍💻 [Dev Auth] Set dev user for path: ${path}, User ID: ${DEV_USER.id}`);
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
    console.warn(`🔍 [Auth Summary] Path: ${path}`);
    console.warn(`🔍 [Auth Summary] HasAuthUser: ${!!authUser}`);
    console.warn(`🔍 [Auth Summary] HasApiKey: ${!!apiKey}`);
    console.warn(`🔍 [Auth Summary] HasAuthHeader: ${!!authHeader}`);
    console.warn(`🔍 [Auth Summary] HasCookies: ${hasCookies}`);
    
    if (authUser) {
      console.warn(`✅ [Auth Summary] Authenticated as User ID: ${authUser.user?.id}`);
    }

    // If API Key was provided but no authUser is set, something went wrong
    if (apiKey && !authUser) {
      console.warn(`⚠️ [Auth Error] API key provided but no authUser set for path ${path}`);
    }
    
    // If we have neither API key nor session, and it's not a public route
    if (!authUser && !isPublicRoute(path)) {
      console.warn(`⚠️ [Auth Warning] No authentication for non-public path: ${path}`);
    }

    return next();
  });

  // Custom error handler with detailed logging
  const customErrorHandler = async (err: Error, c: any) => {
    console.warn(`❌ [Error] Type: ${err.name}, Message: ${err.message}`);
    console.warn(`❌ [Error] Path: ${c.req.path}, Method: ${c.req.method}`);
    console.warn(`❌ [Error] Stack: ${err.stack || 'No stack trace'}`);
    
    // Log request details
    console.warn(`❌ [Error] Headers: ${JSON.stringify(Object.fromEntries(
      Object.entries(c.req.header())
        .filter(([key]) => !["cookie", "authorization"].includes(key.toLowerCase()))
    ))}`);
    
    // Continue with default error handler
    return onError(err, c);
  };

  app.notFound((c) => {
    console.warn(`🔍 [Not Found] Path: ${c.req.path}, Method: ${c.req.method}`);
    return notFound(c);
  })
    .onError(customErrorHandler)
    .use(serveEmojiFavicon("📝"))
    .use(pinoLogger());

  console.warn("🚀 API application created and configured");
  return app;
}

export function createTestApp<R extends AppOpenAPI>(router: R) {
  return createApp().route("/", router);
}
