# Authentication Implementation Analysis

This document provides a comprehensive analysis of the dual authentication system implemented in the Cronicorn API, consisting of:
1. Auth.js (browser-based authentication)
2. API Key authentication (for machine-to-machine communication)

## Table of Contents

1. [Authentication Flow Overview](#authentication-flow-overview)
2. [Key Components](#key-components)
3. [Database Schema](#database-schema)
4. [Implementation Details](#implementation-details)
   - [API Key Authentication Middleware](#api-key-authentication-middleware)
   - [Auth.js Integration](#authjs-integration)
   - [App Creation and Middleware Chain](#app-creation-and-middleware-chain)
   - [Route Handlers](#route-handlers)
5. [Authorization Controls](#authorization-controls)
6. [Security Analysis](#security-analysis)
7. [Improvement Opportunities](#improvement-opportunities)

## Authentication Flow Overview

The API supports two authentication methods:

1. **Auth.js Authentication**: Used primarily for browser-based sessions.
   - Flow: User logs in → Auth.js creates session → Session token stored in cookies → Server validates session on each request

2. **API Key Authentication**: Used for programmatic access.
   - Flow: Client includes API key/secret in headers → Server validates key/secret → Server attaches user identity to request

Both methods populate the `authUser` object in the request context, allowing route handlers to use a consistent authorization model regardless of authentication method.

## Key Components

- `api-key-auth.ts` - Middleware for handling API key authentication
- `create-app.ts` - Main application setup with middleware chain
- `types.ts` - Types for authentication objects
- `requireAuth.ts` - Middleware for enforcing authentication
- `db/schema.ts` - Database schema for API keys
- Various route handlers that use the `authUser` object

## Database Schema

The API Keys are stored in the database with the following structure:

```typescript
export const apiKeys = pgTable("apiKeys", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  secret: text("secret").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  scopes: text("scopes").array().default([]).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  revoked: boolean("revoked").default(false).notNull(),
  createdAt: timestamp("createdAt").$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt").$defaultFn(() => new Date()),
});
```

Notable fields:
- `key`: Public part of the API key pair (included in headers)
- `secret`: Private part of the API key pair (included in headers)
- `userId`: Foreign key to the user who owns this API key
- `scopes`: Array of permission scopes granted to this key
- `revoked`: Boolean flag to disable a key without deleting it
- `lastUsedAt`: Timestamp updated whenever the key is used successfully

## Implementation Details

### API Key Authentication Middleware

**Location**: `src/middlewares/api-key-auth.ts`

This middleware:
1. Extracts API key and secret from headers
2. Validates the key/secret combination against the database
3. Checks if the key is revoked
4. Sets the `authUser` context with user information and API key metadata
5. Updates the `lastUsedAt` timestamp for the key

```typescript
// Key implementation highlights
const key = headers.get("X-API-Key");
const secret = headers.get("X-API-Secret");

if (!key || !secret) {
  return c.next();
}

const apiKey = await db.query.apiKeys.findFirst({
  where: (fields, { eq, and }) => 
    and(eq(fields.key, key), eq(fields.secret, secret), eq(fields.revoked, false)),
  with: {
    user: true,
  },
});

if (apiKey) {
  // Set authUser context with API key info
  c.set("authUser", {
    user: { id: apiKey.userId },
    apiKeyAuth: {
      id: apiKey.id,
      name: apiKey.name,
      scopes: apiKey.scopes,
    }
  });

  // Update lastUsedAt timestamp
  await db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));
}
```

### Auth.js Integration

Auth.js provides browser-based authentication and sets the `authUser` context with user information from the session.

### App Creation and Middleware Chain

**Location**: `src/lib/create-app.ts`

The application middleware chain is set up with:

1. API Key Authentication middleware first
2. Auth.js verification second
3. Skip Auth.js verification if API key authentication succeeded

```typescript
// API Key Authentication
app.use("*", apiKeyAuth);

// Auth.js Verification (skipped if API key auth succeeded)
app.use("*", async (c, next) => {
  const authUser = c.get("authUser");
  // Skip Auth.js verification if API key auth already set the authUser
  if (authUser && authUser.apiKeyAuth) {
    return next();
  }
  return verifyAuth(c, next);
});
```

### Route Handlers

Route handlers use the `authUser` context to restrict access to resources. For example, in the jobs handler:

```typescript
export const list: AppRouteHandler<ListRoute> = async (c) => {
  // Restrict to authenticated user's jobs
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;
  
  // Fetch jobs with userId filter
  const items = await db.query.jobs.findMany({
    where: (fields, { eq }) => eq(fields.userId, userId),
    // ...
  });
  
  // ...
}
```

## Authorization Controls

Authorization is primarily based on user ID filtering in database queries. Each route handler:

1. Extracts the authenticated user's ID from the `authUser` context
2. Uses this ID to filter database queries to only return/modify resources owned by the user
3. Returns 404 Not Found for resources that don't belong to the user

Example from the jobs handler:
```typescript
export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;
  const id = c.req.param("id");
  
  const job = await db.query.jobs.findFirst({
    where: (fields, { eq, and }) => and(eq(fields.id, id), eq(fields.userId, userId)),
  });
  
  if (!job) {
    return c.json({ error: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }
  
  return c.json(job);
};
```

## Security Analysis

### Strengths

1. **Dual Authentication Options**: Supports both browser-based and API key authentication
2. **Consistent Authorization Model**: Both auth methods populate the same `authUser` context
3. **Database-Level Filtering**: Resources are filtered by user ID at the database level
4. **API Key Revocation**: Keys can be revoked without being deleted
5. **Usage Tracking**: `lastUsedAt` timestamp provides audit information

### Vulnerabilities and Concerns

1. **Non-nullable Assertions**: Many handlers use `authUser!.user!.id` which could cause runtime errors if authentication middleware fails to properly set these values
   
2. **Header-based Authentication**: API keys are passed in headers, which are:
   - Stored in server logs by default
   - Visible in client-side network monitors
   
3. **Plain Text Secrets**: API key secrets are stored and transmitted as plain text

4. **Missing Scopes Enforcement**: The `scopes` field exists but isn't actively enforced in route handlers

5. **No Rate Limiting**: No protection against brute force attacks on API key authentication

6. **No Key Rotation Mechanism**: No built-in process for rotating API keys

7. **Minimal Validation**: Limited validation of API key format/length

## Improvement Opportunities

1. **Require Auth Middleware**: Create a middleware that explicitly checks for valid `authUser` to prevent non-nullable assertion issues:

```typescript
export const requireAuth = async (c: Context<AppBindings>, next: Next): Promise<Response | void> => {
  const authUser = c.get("authUser");
  if (!authUser || !authUser.user || !authUser.user.id) {
    return c.json(
      { error: HttpStatusPhrases.UNAUTHORIZED },
      HttpStatusCodes.UNAUTHORIZED
    );
  }
  return next();
};
```

2. **Scope Enforcement**: Add middleware to check required scopes for specific endpoints:

```typescript
export const requireScopes = (requiredScopes: string[]) => {
  return async (c: Context<AppBindings>, next: Next): Promise<Response | void> => {
    const authUser = c.get("authUser");
    
    // Skip scope check for Auth.js authentication
    if (!authUser?.apiKeyAuth) {
      return next();
    }
    
    const hasRequiredScopes = requiredScopes.every(scope => 
      authUser.apiKeyAuth.scopes.includes(scope)
    );
    
    if (!hasRequiredScopes) {
      return c.json(
        { error: "Insufficient permissions" },
        HttpStatusCodes.FORBIDDEN
      );
    }
    
    return next();
  };
};
```

3. **API Key Enhancements**:
   - Hash secrets in the database
   - Implement key rotation mechanisms
   - Add expiration dates to keys
   - Enforce minimum key/secret length and complexity

4. **Rate Limiting**: Implement rate limiting for API key authentication attempts

5. **Authorization Abstraction**: Create a utility function for ownership checks to avoid repetition in route handlers:

```typescript
export async function checkResourceOwnership<T extends { userId: string }>(
  userId: string,
  resourceId: string,
  table: PgTable,
): Promise<T | null> {
  return db.query[table.name].findFirst({
    where: (fields, { eq, and }) => 
      and(eq(fields.id, resourceId), eq(fields.userId, userId)),
  }) as Promise<T | null>;
}
```

6. **Comprehensive Testing**: Expand test coverage for authentication and authorization scenarios

By implementing these improvements, the authentication system would be more robust, secure, and maintainable.
