import type { Context, Next } from "hono";

import { HTTPException } from "hono/http-exception";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppBindings } from "../lib/types";

/**
 * Middleware that ensures a user is authenticated before proceeding to the route handler
 * Can be applied to specific routes that require authentication
 */
export function requireAuth() {
    return async (c: Context<AppBindings>, next: () => Promise<void>) => {
        const authUser = c.get("authUser");

        // Check if user is authenticated (either via Auth.js or API key)
        if (!authUser || !authUser.user || !authUser.user.id) {
            throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
                message: "Authentication required",
            });
        }

        // User is authenticated, proceed to the next middleware or route handler
        return next();
    };
}

/**
 * Creates a middleware that checks if an API key has the required scopes.
 * Only applies to requests authenticated via API key (skips Auth.js authenticated requests).
 *
 * @param requiredScopes - Array of scope strings that are required for access
 * @returns Middleware function that checks scopes
 */
export function requireScopes(requiredScopes: string[]) {
    return async (c: Context<AppBindings>, next: Next): Promise<Response | void> => {
        const authUser = c.get("authUser");

        // Skip scope check for Auth.js authentication (not API key auth)
        if (!authUser?.apiKeyAuth) {
            return next();
        }

        // Check if the API key has all required scopes
        const hasRequiredScopes = requiredScopes.every(scope =>
            authUser.apiKeyAuth?.scopes.includes(scope) ?? false,
        );

        if (!hasRequiredScopes) {
            throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
                message: "Insufficient permissions: missing required scopes",
            });
        }

        return next();
    };
}
