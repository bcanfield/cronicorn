---
applyTo: "apps/api/src/middlewares/**,apps/api/src/lib/create-auth-config.ts,apps/web/src/**"
description: Comprehensive documentation for authentication and authorization patterns, including session-based auth, API key auth, and security best practices.
---

# Authentication & Authorization Documentation

This document outlines the authentication and authorization architecture for our application, covering both session-based and API key authentication methods.

> **IMPORTANT:** If you detect any new patterns, best practices, or inconsistencies between this document and the actual implementation in the codebase, please update these instructions to reflect the current best practices.

## Authentication Architecture

### Dual Authentication System
Our application supports two authentication methods:

1. **Session-based Authentication** (Auth.js) - For web users
2. **API Key Authentication** - For programmatic access

Both methods can be used simultaneously and are processed through a unified middleware stack.

## Session-Based Authentication (Auth.js)

### Configuration
Authentication is configured in `src/lib/create-auth-config.ts`:

```typescript
export default function createAuthConfig(): AuthConfig {
  return {
    adapter: DrizzleAdapter(db),
    secret: env.AUTH_SECRET,
    providers: [
      GitHub({
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      }),
    ],
    callbacks: {
      signIn: async ({ user }) => {
        return !!user;
      },
    },
  };
}
```

### Features
- **OAuth Integration**: GitHub OAuth provider configured
- **Database Sessions**: Sessions stored in database via Drizzle adapter
- **User Management**: Automatic user creation and management
- **Session Persistence**: Secure session handling with signed cookies

### Database Tables
Session authentication uses several tables:
- **users**: Core user information
- **accounts**: OAuth provider accounts
- **sessions**: Active user sessions
- **verification_tokens**: Email verification and password reset

## API Key Authentication

### Overview
API keys provide programmatic access to the API with fine-grained scope control.

### Headers
API key authentication requires two headers:
```
X-API-Key: your_api_key_here
X-API-Secret: your_api_secret_here
```

### Security Features
- **Salted Secrets**: API secrets are hashed with individual salts
- **Expiration**: Keys can have expiration dates
- **Revocation**: Keys can be revoked instantly
- **Usage Tracking**: Last used timestamp is updated on each use
- **Scope Control**: Fine-grained permissions via scopes

### API Key Lifecycle

#### Creation
```typescript
// Create API key with salted secret
const { hashedSecret, salt } = hashApiKeySecret(plainSecret);

await db.insert(apiKeys).values({
  id: crypto.randomUUID(),
  key: generateApiKey(),
  secret: hashedSecret,
  secretSalt: salt,
  name: keyName,
  userId: user.id,
  scopes: ["read", "write"],
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
});
```

#### Verification
```typescript
// Verify API key secret with salt
const isValidSecret = verifyApiKeySecret(
  providedSecret,
  storedHashedSecret,
  storedSalt
);
```

#### Revocation
```typescript
// Revoke API key
await db.update(apiKeys)
  .set({ revoked: true })
  .where(eq(apiKeys.id, keyId));
```

## Middleware Stack

### Authentication Middleware Order
The middleware stack processes authentication in this order:

1. **Session Auth Middleware** (Auth.js) - Checks for valid session
2. **API Key Auth Middleware** - Checks for API key headers if no session
3. **Route Handler** - Processes request with authenticated user

### API Key Authentication Middleware

Located in `src/middlewares/api-key-auth.ts`:

```typescript
export function apiKeyAuth() {
  return async (c: Context<AppBindings>, next: () => Promise<void>) => {
    // Skip if user already authenticated via session
    if (c.get("authUser")) {
      return next();
    }

    // Check for API key headers
    const apiKey = c.req.header("X-API-Key");
    const apiSecret = c.req.header("X-API-Secret");

    if (!apiKey || !apiSecret) {
      return next(); // Continue without auth
    }

    // Verify credentials and set authUser context
    // ... validation logic
  };
}
```

### Authorization Middleware

Located in `src/middlewares/require-auth.ts`:

#### Basic Authentication Check
```typescript
export function requireAuth() {
  return async (c: Context<AppBindings>, next: () => Promise<void>) => {
    const authUser = c.get("authUser");

    if (!authUser || !authUser.user || !authUser.user.id) {
      throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
        message: "Authentication required",
      });
    }

    return next();
  };
}
```

#### Scope-Based Authorization
```typescript
export function requireScopes(requiredScopes: string[]) {
  return async (c: Context<AppBindings>, next: Next): Promise<Response | void> => {
    const authUser = c.get("authUser");

    // Skip scope check for session auth (not API key auth)
    if (!authUser?.apiKeyAuth) {
      return next();
    }

    // Check if API key has required scopes
    const hasRequiredScopes = requiredScopes.every(scope =>
      authUser.apiKeyAuth?.scopes.includes(scope) ?? false
    );

    if (!hasRequiredScopes) {
      throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
        message: "Insufficient permissions: missing required scopes",
      });
    }

    return next();
  };
}
```

## User Context

### AuthUser Structure
Both authentication methods populate a unified user context:

```typescript
interface ExtendedAuthUser {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: Date | null;
    image: string | null;
  };
  session: {
    expires: string;
  };
  // Only present for API key authentication
  apiKeyAuth?: {
    id: string;
    name: string;
    scopes: string[];
  };
}
```

### Usage in Handlers
Access authenticated user in route handlers:

```typescript
export const list: AppRouteHandler<ListRoute> = async (c) => {
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;
  
  // Query data scoped to authenticated user
  const items = await db.query.jobs.findMany({
    where: eq(jobs.userId, userId),
  });
  
  return c.json({ items });
};
```

## Authorization Patterns

### Route Protection
Apply authentication to routes using middleware:

```typescript
// Require authentication
const router = createRouter()
  .use(requireAuth())
  .openapi(routes.list, handlers.list);

// Require specific scopes
const adminRouter = createRouter()
  .use(requireAuth())
  .use(requireScopes(["admin"]))
  .openapi(routes.adminFunction, handlers.adminFunction);
```

### Data Scoping
All user data is automatically scoped to the authenticated user:

```typescript
// Always filter by authenticated user ID
const items = await db.query.jobs.findMany({
  where: eq(jobs.userId, authUser.user.id),
});

// Insert with user association
await db.insert(jobs).values({
  ...jobData,
  userId: authUser.user.id,
});
```

### Scope-Based Permissions
API keys can have different permission levels:

```typescript
// Common scopes
const SCOPES = {
  READ: "read",           // Read-only access
  WRITE: "write",         // Create and update
  DELETE: "delete",       // Delete operations
  ADMIN: "admin",         // Administrative functions
} as const;

// Route with scope requirements
.use(requireScopes([SCOPES.WRITE]))
.openapi(routes.create, handlers.create)
```

## Frontend Authentication

### Web App Integration
The web application integrates with the API authentication:

1. **Session Management**: Auth.js handles OAuth flow and session cookies
2. **API Client**: Automatically includes session cookies in API requests
3. **Authentication State**: React components can access auth state

### API Client Configuration
```typescript
// Web app API client configuration
import apiClient from "@tasks-app/api-client";

export default apiClient("/"); // Base URL for API
```

### Authentication Flow
1. User clicks "Sign in with GitHub"
2. OAuth flow redirects to GitHub
3. GitHub redirects back with authorization code
4. Auth.js exchanges code for user data
5. Session cookie is set
6. API requests include session cookie automatically

## Security Best Practices

### API Key Security
1. **Secure Generation**: Use cryptographically secure random generation
2. **Hashed Storage**: Never store plain text secrets
3. **Salt Usage**: Individual salts for each secret
4. **Rotation**: Regular key rotation capabilities
5. **Scope Limitation**: Principle of least privilege

### Session Security
1. **Secure Cookies**: HTTPOnly, Secure, SameSite attributes
2. **Session Expiration**: Reasonable expiration times
3. **CSRF Protection**: Built into Auth.js
4. **Secret Management**: Strong AUTH_SECRET for signing

### General Security
1. **HTTPS Only**: All authentication requires HTTPS in production
2. **Error Handling**: Generic error messages to prevent information leakage
3. **Rate Limiting**: Consider implementing rate limiting for auth endpoints
4. **Audit Logging**: Track authentication events

## Environment Configuration

### Required Environment Variables
```bash
# Auth.js configuration
AUTH_SECRET=your_long_random_string_here
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

# Database
DATABASE_URL=postgresql://username:password@host:port/database
```

### Development Setup
1. Create GitHub OAuth App in GitHub Developer Settings
2. Set authorization callback URL to `http://localhost:3000/api/auth/callback/github`
3. Copy client ID and secret to environment variables

## Error Handling

### Authentication Errors
- **401 Unauthorized**: Missing or invalid credentials
- **403 Forbidden**: Valid credentials but insufficient permissions
- **Generic Messages**: Avoid revealing specific failure reasons

### Error Response Format
```typescript
{
  "error": {
    "message": "Authentication required",
    "issues": []
  },
  "success": false
}
```

## Testing Authentication

### Unit Tests
Test authentication middleware in isolation:
- Mock valid/invalid credentials
- Test scope validation
- Test error conditions

### Integration Tests
Test full authentication flow:
- OAuth flow simulation
- API key creation and usage
- Protected route access

### Test Fixtures
Create test users and API keys for consistent testing:
```typescript
const testUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};

const testApiKey = {
  key: "test-api-key",
  secret: "test-secret",
  scopes: ["read", "write"],
};
```

## Monitoring and Debugging

### Logging
Authentication events are logged for debugging:
- Successful authentications
- Failed authentication attempts
- API key usage
- Scope violations

### Metrics to Track
- Authentication success/failure rates
- API key usage patterns
- Session duration
- Failed authentication attempts by IP

## Migration and Backwards Compatibility

### API Key Migration
- Legacy keys without salts are supported
- Gradual migration to salted secrets
- Fallback to direct comparison for old keys

### Database Schema Evolution
- Incremental schema updates
- Backwards compatible changes where possible
- Migration scripts for data transformation