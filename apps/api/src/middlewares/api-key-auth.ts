import type { Context } from "hono";

import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppBindings, ExtendedAuthUser } from "../lib/types";

import db from "../db";
import { apiKeys } from "../db/schema";

// Header name for API key authentication
const API_KEY_HEADER = "X-API-Key";
const API_SECRET_HEADER = "X-API-Secret";

// Custom middleware for API key authentication
export function apiKeyAuth() {
  return async (c: Context<AppBindings>, next: () => Promise<void>) => {
    try {
      // Skip if authUser is already set (means auth.js middleware has already authenticated)
      if (c.get("authUser")) {
        return next();
      }

      // Check for API key in headers
      const apiKey = c.req.header(API_KEY_HEADER);
      const apiSecret = c.req.header(API_SECRET_HEADER);

      // If neither header is present, skip this middleware (might be handled by auth.js)
      if (!apiKey && !apiSecret) {
        return next();
      }

      // Both key and secret must be provided
      if (!apiKey || !apiSecret) {
        throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
          message: "Both API key and secret must be provided",
        });
      }

      // Log the API key (first 4 chars for security) being checked
      console.warn(`Checking API key: ${apiKey.substring(0, 4)}...`);

      // Look up API key in the database
      const foundApiKey = await db.query.apiKeys.findFirst({
        where: (fields, { eq }) => eq(fields.key, apiKey),
      });

      if (!foundApiKey) {
        console.warn(`API key not found: ${apiKey.substring(0, 4)}...`);
        throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
          message: "Invalid API credentials",
        });
      }

      // Get the associated user
      const user = await db.query.users.findFirst({
        where: (fields, { eq }) => eq(fields.id, foundApiKey.userId),
      });

      if (!user) {
        throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
          message: "User associated with API key not found",
        });
      }

      // Check if API key is revoked or expired
      if (
        foundApiKey.revoked
        || (foundApiKey.expiresAt && new Date(foundApiKey.expiresAt) < new Date())
      ) {
        throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
          message: "Invalid API credentials",
        });
      }

      // Verify the API key secret
      // If secretSalt exists, use the new hashing mechanism
      if (foundApiKey.secretSalt) {
        // Import here to avoid circular dependencies
        const { verifyApiKeySecret } = await import("../lib/api-key-utils");

        const isValidSecret = verifyApiKeySecret(
          apiSecret,
          foundApiKey.secret,
          foundApiKey.secretSalt,
        );

        if (!isValidSecret) {
          throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
            message: "Invalid API credentials",
          });
        }
      }
      // Fallback to direct comparison for legacy keys (not hashed)
      else if (foundApiKey.secret !== apiSecret) {
        throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
          message: "Invalid API credentials",
        });
      }

      // Update the last used timestamp
      await db.update(apiKeys)
        .set({ lastUsedAt: new Date().toISOString() })
        .where(eq(apiKeys.id, foundApiKey.id));

      console.warn(`API key authentication successful for user ${user.id}, key ${foundApiKey.id}`);

      // Set the authUser context with the API key's user
      // Ensure user object matches AdapterUser structure exactly as expected by route handlers
      const authUser: ExtendedAuthUser = {
        user: {
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          emailVerified: user.emailVerified,
          image: user.image || null,
        },
        session: {
          // Make sure session expiry is a valid date string
          expires: foundApiKey.expiresAt
            ? new Date(foundApiKey.expiresAt).toISOString()
            : new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        },
        // Add API key information to indicate this was authenticated via API key
        apiKeyAuth: {
          id: foundApiKey.id,
          name: foundApiKey.name,
          scopes: foundApiKey.scopes || [],
        },
      };

      // Validate that authUser has the expected structure before setting it
      if (!authUser.user || !authUser.user.id) {
        console.warn(`Error: Invalid user structure in API key auth for key ${apiKey}`);
        throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
          message: "User authentication failed",
        });
      }

      c.set("authUser", authUser);
      console.warn(`Set authUser in context: ${JSON.stringify({ userId: authUser.user?.id, keyId: authUser.apiKeyAuth?.id })}`);

      // Continue to the next middleware or route handler
      return next();
    }
    catch (error) {
      // If it's not an HTTPException already, wrap it
      if (!(error instanceof HTTPException)) {
        throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
          message: "API key authentication failed",
        });
      }
      throw error;
    }
  };
}
