---
applyTo: "apps/api/**"
description: Comprehensive documentation for the API workspace architecture, patterns, and best practices for building consistent, maintainable API endpoints.
---

# API Architecture Documentation

This document outlines the architecture, file structure, and patterns for our Hono-based API application. Follow these guidelines to ensure consistency across the codebase.

> **IMPORTANT:** If you detect any new patterns, best practices, or inconsistencies between this document and the actual implementation in the codebase, please update these instructions to reflect the current best practices.

## Directory Structure

Our API follows a feature-based organization with clear separation of concerns:

```
apps/api/
├── src/
│   ├── app.ts                 # Main application assembly
│   ├── index.ts               # Server entry point
│   ├── client.ts              # Client configuration
│   ├── env.ts                 # Environment variable validation
│   ├── db/                    # Database layer
│   │   ├── index.ts           # Database connection and export
│   │   ├── schema.ts          # Schema exports (re-exports from schema/)
│   │   ├── schema/            # Individual schema definitions
│   │   │   ├── common.ts      # Shared schema utilities
│   │   │   ├── auth.ts        # Authentication tables
│   │   │   ├── jobs.ts        # Jobs table definition
│   │   │   ├── api-keys.ts    # API keys table
│   │   │   └── ...            # Other entity schemas
│   │   ├── migrations/        # Drizzle migrations
│   │   ├── seed/              # Database seeding utilities
│   │   ├── reset.ts           # Database reset script
│   │   └── run-seed.ts        # Seeding execution script
│   ├── lib/                   # Shared utilities and configurations
│   │   ├── create-app.ts      # Hono app factory
│   │   ├── configure-open-api.ts # OpenAPI/Swagger setup
│   │   ├── create-auth-config.ts # Authentication configuration
│   │   ├── types.ts           # Shared TypeScript types
│   │   ├── constants.ts       # Application constants
│   │   ├── api-key-utils.ts   # API key utilities
│   │   └── dev-user.ts        # Development user utilities
│   ├── middlewares/           # Hono middleware
│   │   ├── pino-logger.ts     # Logging middleware
│   │   ├── require-auth.ts    # Authentication middleware
│   │   └── api-key-auth.ts    # API key authentication
│   ├── routes/                # API endpoints organized by entity
│   │   ├── index.ts           # Route registration
│   │   └── <entity>/          # Per-entity route modules
│   │       ├── <entity>.handlers.ts   # Business logic handlers
│   │       ├── <entity>.routes.ts     # OpenAPI route definitions
│   │       ├── <entity>.index.ts      # Route assembly and export
│   │       └── <entity>.test.ts       # Entity-specific tests
│   └── tests/                 # Shared test utilities
```

## Core Architecture Components

### 1. Application Assembly (app.ts)

The main application assembly file that:
- Creates the Hono app instance
- Configures OpenAPI documentation
- Registers all route modules
- Exports the app type for client generation

```typescript
import configureOpenAPI from "@/api/lib/configure-open-api";
import createApp from "@/api/lib/create-app";
import jobs from "@/api/routes/jobs/jobs.index";
// ... other imports

const app = createApp();
configureOpenAPI(app);

const routes = [jobs, apiKeys, messages, endpoints] as const;
routes.forEach((route) => {
  app.route("/", route);
});

export type AppType = typeof routes[number];
export default app;
```

### 2. Database Layer (db/)

#### Schema Organization
- **Individual files** in `schema/` for each entity
- **Common utilities** in `schema/common.ts` for shared patterns
- **Main export** in `schema.ts` that re-exports all schemas

Example schema structure:
```typescript
// schema/jobs.ts
export const jobStatusEnum = pgEnum("JobStatus", ["ACTIVE", "PAUSED", "ARCHIVED"]);

export const jobs = pgTable("Job", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  definitionNL: text("definitionNL").notNull(),
  status: jobStatusEnum("status").default("PAUSED").notNull(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  // ... other fields
});

// Generate Zod schemas for validation
export const insertJobsSchema = createInsertSchema(jobs);
export const selectJobsSchema = createSelectSchema(jobs);
export const patchJobsSchema = insertJobsSchema.partial();
```

#### Migration Management
- Use Drizzle Kit for schema generation: `pnpm db:generate`
- Migrations stored in `migrations/` directory
- Apply with: `pnpm db:migrate` or `pnpm db:push`

### 3. Route Architecture

Each entity follows a consistent three-file pattern:

#### Route Definitions (*.routes.ts)
OpenAPI route definitions using `@hono/zod-openapi`:

```typescript
import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { insertJobsSchema, selectJobsSchema } from "@/api/db/schema";

const tags = ["Jobs"];

export const list = createRoute({
  path: "/jobs",
  method: "get",
  tags,
  summary: "List jobs",
  request: {
    query: listJobsQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(listResponseSchema, "Jobs retrieved"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(createErrorSchema(listJobsQuerySchema), "Invalid query parameters"),
  },
});

export const create = createRoute({
  path: "/jobs", 
  method: "post",
  tags,
  summary: "Create job",
  request: {
    body: jsonContentRequired(insertJobsSchema, "Job data"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(selectJobsSchema, "Job created"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(createErrorSchema(insertJobsSchema), "Invalid job data"),
  },
});
```

#### Handler Implementation (*.handlers.ts)
Business logic implementation:

```typescript
import type { AppRouteHandler } from "@/api/lib/types";
import db from "@/api/db";
import { jobs } from "@/api/db/schema";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;
  const { page, pageSize, sortBy, sortDirection, searchQuery } = c.req.valid("query");
  
  const offset = (page - 1) * pageSize;
  const limit = pageSize + 1;
  
  const items = await db.query.jobs.findMany({
    where: (fields, { eq, ilike, and }) => {
      const baseCond = eq(fields.userId, userId);
      if (searchQuery) {
        return and(baseCond, ilike(fields.definitionNL, `%${searchQuery}%`));
      }
      return baseCond;
    },
    orderBy: (fields, { asc, desc }) => 
      sortDirection === "asc" ? asc(fields[sortBy]) : desc(fields[sortBy]),
    offset,
    limit,
  });
  
  const hasNext = items.length > pageSize;
  if (hasNext) items.pop();
  
  return c.json({ items, hasNext });
};
```

#### Route Assembly (*.index.ts)
Combines routes and handlers into a router:

```typescript
import { createRouter } from "@/api/lib/create-app";
import * as handlers from "./jobs.handlers";
import * as routes from "./jobs.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.create)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.patch, handlers.patch)
  .openapi(routes.remove, handlers.remove);

export default router;
```

### 4. Authentication & Authorization

#### Middleware Stack
- **pino-logger.ts**: Request/response logging
- **require-auth.ts**: Session-based authentication
- **api-key-auth.ts**: API key authentication for programmatic access

#### Auth Configuration
- Uses Auth.js with Drizzle adapter
- Configured in `lib/create-auth-config.ts`
- User sessions stored in database tables

### 5. OpenAPI Documentation

- Configured in `lib/configure-open-api.ts`
- Auto-generated from route definitions
- Available at `/doc` endpoint in development
- Provides interactive API documentation

### 6. Type Safety

#### Shared Types
- **AppRouteHandler**: Typed handler interface
- **Route types**: Generated from OpenAPI route definitions
- **Schema types**: Generated from Drizzle schemas

#### Type Exports
API package exports types via `package.json` exports:
```json
{
  "exports": {
    "./routes": "./src/routes/index.ts",
    "./schema": "./src/db/schema.ts",
    "./db/query-schemas": {
      "types": "./dist/src/db/query-schemas.d.ts",
      "import": "./dist/src/db/query-schemas.js"
    }
  }
}
```

## Development Patterns

### 1. Adding a New Entity

Follow these steps to add a new entity with full CRUD operations:

1. **Create database schema**:
   ```typescript
   // src/db/schema/my-entity.ts
   export const myEntities = pgTable("MyEntity", {
     id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
     name: text("name").notNull(),
     userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
     createdAt: timestamp("createdAt", { mode: "string" }).defaultNow(),
     updatedAt: timestamp("updatedAt", { mode: "string" }).defaultNow(),
   });
   
   export const insertMyEntitySchema = createInsertSchema(myEntities);
   export const selectMyEntitySchema = createSelectSchema(myEntities);
   export const patchMyEntitySchema = insertMyEntitySchema.partial();
   ```

2. **Export from main schema**:
   ```typescript
   // src/db/schema.ts
   export * from "./schema/my-entity";
   ```

3. **Create route files**:
   ```bash
   mkdir src/routes/my-entities
   touch src/routes/my-entities/my-entities.routes.ts
   touch src/routes/my-entities/my-entities.handlers.ts
   touch src/routes/my-entities/my-entities.index.ts
   touch src/routes/my-entities/my-entities.test.ts
   ```

4. **Register routes**:
   ```typescript
   // src/app.ts or src/routes/index.ts
   import myEntities from "./my-entities/my-entities.index";
   
   const routes = [...existingRoutes, myEntities] as const;
   ```

### 2. Error Handling

- Use **stoker** for standardized HTTP status codes and error schemas
- Return consistent error structures from handlers
- Validate input using Zod schemas at route level

### 3. Database Queries

- Use **Drizzle query builder** for type-safe database access
- Implement **pagination** with `offset` and `limit`
- Use **user-scoped queries** for multi-tenant data isolation
- Prefer **query.findMany()** over raw SQL when possible

### 4. Testing

- Write unit tests for handlers in `*.test.ts` files
- Use Vitest as the test runner
- Mock database queries for isolated testing
- Test error conditions and edge cases

## Best Practices

1. **Consistency**: Follow the three-file pattern for all entities
2. **Type Safety**: Use generated types throughout the application
3. **Authentication**: Always scope queries to authenticated users
4. **Validation**: Use Zod schemas for all input validation
5. **Documentation**: Include OpenAPI descriptions for all routes
6. **Error Handling**: Return appropriate HTTP status codes and error messages
7. **Performance**: Implement pagination for list endpoints
8. **Security**: Validate and sanitize all user inputs

## Configuration

### Environment Variables
- Validated in `env.ts` using Zod
- Required variables documented in schema
- Development defaults provided where appropriate

### Database Configuration
- Connection configured in `db/index.ts`
- Support for PostgreSQL and Turso (SQLite)
- Migrations managed by Drizzle Kit

### Build & Deployment
- TypeScript compilation with path alias resolution
- Build output in `dist/` directory
- Exports for API client generation