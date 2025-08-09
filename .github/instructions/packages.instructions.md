---
applyTo: "packages/**"
description: Comprehensive documentation for package architecture, dependencies, data flow, and interaction patterns between workspaces.
---

# Package Architecture & Data Flow Documentation

This document outlines the package architecture, inter-package dependencies, and data flow patterns for our monorepo workspace structure.

> **IMPORTANT:** If you detect any new patterns, best practices, or inconsistencies between this document and the actual implementation in the codebase, please update these instructions to reflect the current best practices.

## Monorepo Structure

### Workspace Organization
Our monorepo uses pnpm workspaces with the following organization:

```
cronicorn/
├── apps/                     # Application workspaces
│   ├── api/                  # Backend API server
│   └── web/                  # Frontend React application
├── packages/                 # Shared packages
│   ├── api-client/          # Type-safe API client
│   ├── eslint-config/       # Shared ESLint configuration
│   └── ui/                  # Shared UI components and styles
├── package.json             # Root workspace configuration
├── pnpm-workspace.yaml      # Workspace package patterns
└── pnpm-lock.yaml          # Lockfile for all dependencies
```

### Workspace Configuration
```yaml
# pnpm-workspace.yaml
packages:
  - apps/*
  - packages/*
```

## Package Responsibilities

### 1. API Package (`apps/api`)
**Purpose**: Backend API server providing data and business logic

**Key Exports**:
```json
{
  "exports": {
    "./routes": "./src/routes/index.ts",           // Router type exports
    "./schema": "./src/db/schema.ts",              // Database schema exports
    "./db/query-schemas": {                        // Query validation schemas
      "types": "./dist/src/db/query-schemas.d.ts",
      "import": "./dist/src/db/query-schemas.js"
    }
  }
}
```

**Dependencies**:
- Database: PostgreSQL with Drizzle ORM
- Web Framework: Hono with OpenAPI support
- Authentication: Auth.js with GitHub OAuth

### 2. Web Package (`apps/web`)
**Purpose**: Frontend React application providing user interface

**Key Dependencies**:
```json
{
  "@tasks-app/api": "workspace:*",         // Type imports and schemas
  "@tasks-app/api-client": "workspace:*",  // API communication
  "@workspace/ui": "workspace:*"           // Shared UI components
}
```

**Technologies**:
- Framework: React 19 with TanStack Router
- State Management: TanStack Query for server state
- Styling: Tailwind CSS with UI package components

### 3. API Client Package (`packages/api-client`)
**Purpose**: Type-safe HTTP client for API communication

**Architecture**:
```typescript
// Type-safe client generation from API routes
import type { router } from "@tasks-app/api/routes";
import { hc } from "hono/client";

const client = hc<router>("");
export type Client = typeof client;

export default (...args: Parameters<typeof hc>): Client =>
  hc<router>(...args);
```

**Features**:
- **Type Safety**: Full TypeScript support derived from API routes
- **RPC-Style**: Method chaining with proper typing
- **Error Handling**: Structured error response types

### 4. UI Package (`packages/ui`)
**Purpose**: Shared component library and design system

**Structure**:
```
packages/ui/src/
├── components/              # React components
│   ├── button.tsx          # Button component
│   ├── form.tsx            # Form components
│   ├── card.tsx            # Card layouts
│   └── ...                 # Other UI primitives
├── hooks/                  # Shared React hooks
├── lib/                    # Utility functions
│   └── utils.ts            # Class merging and utilities
└── styles/                 # Global styles and themes
    └── globals.css         # CSS variables and global styles
```

**Exports**:
```json
{
  "exports": {
    "./globals.css": "./src/styles/globals.css",
    "./postcss.config": "./postcss.config.mjs",
    "./lib/*": "./src/lib/*.ts",
    "./components/*": "./src/components/*.tsx",
    "./hooks/*": "./src/hooks/*.ts"
  }
}
```

### 5. ESLint Config Package (`packages/eslint-config`)
**Purpose**: Shared linting configuration across all workspaces

**Features**:
- Consistent code style enforcement
- TypeScript-aware rules
- React-specific linting for web components

## Data Flow Architecture

### 1. Client-Server Communication Flow

```
Web App → API Client → API Routes → Database
   ↓         ↓           ↓           ↓
React    Type-safe   Hono +      PostgreSQL
Query    HTTP calls  Drizzle     with Schema
```

#### Detailed Flow:
1. **User Action**: User interacts with React component
2. **Query/Mutation**: TanStack Query triggers API call
3. **API Client**: Type-safe client makes HTTP request
4. **API Route**: Hono route handler processes request
5. **Database**: Drizzle ORM executes database query
6. **Response**: Data flows back through the same chain
7. **UI Update**: React components re-render with new data

### 2. Type Safety Flow

```
Database Schema → Drizzle Types → API Routes → Client Types
       ↓              ↓              ↓            ↓
   PostgreSQL    Generated Zod   OpenAPI     hc<router>
   Definitions    Schemas       Definitions   Types
```

#### Type Generation:
1. **Schema Definition**: Database tables defined in Drizzle schema
2. **Zod Generation**: `createInsertSchema` and `createSelectSchema`
3. **API Route Types**: OpenAPI routes with Zod validation
4. **Client Types**: Hono RPC client infers types from routes

### 3. Authentication Flow

```
GitHub OAuth → Auth.js → Session Cookie → API Requests
     ↓           ↓            ↓             ↓
  OAuth Code   User Session  HTTP Cookie   Authenticated
  Exchange     Database      Auto-included  User Context
```

#### API Key Alternative:
```
API Key Headers → Key Validation → User Context → Scoped Data
      ↓               ↓               ↓            ↓
  X-API-Key       Database       Set authUser   User-filtered
  X-API-Secret    Lookup         in Context     Queries
```

## Package Interaction Patterns

### 1. Web → API Client → API

**Query Pattern**:
```typescript
// In web app query file (apps/web/src/lib/queries/jobs.queries.ts)
import apiClient from "../api-client";

export function jobsQueryOptions(params: listJobsSchema) {
  return queryOptions({
    queryKey: ["list-jobs", params],
    queryFn: async ({ queryKey: [, q] }) => {
      const resp = await apiClient.api.jobs.$get({ query: q });
      return resp.json();
    },
  });
}
```

**Mutation Pattern**:
```typescript
// Create operation
export const createJob = async (job: insertJobsSchema) => {
  const response = await apiClient.api.jobs.$post({ json: job });
  const json = await response.json();
  if ("success" in json && !json.success) {
    throw new Error(formatApiError(json));
  }
  return json;
};
```

### 2. API → Database Schema

**Schema Import**:
```typescript
// In API route handlers (apps/api/src/routes/jobs/jobs.handlers.ts)
import { jobs, insertJobsSchema } from "@/api/db/schema";
import db from "@/api/db";

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const jobData = c.req.valid("json");
  const authUser = c.get("authUser");
  
  const newJob = await db.insert(jobs).values({
    ...jobData,
    userId: authUser!.user!.id,
  }).returning();
  
  return c.json(newJob[0], HttpStatusCodes.CREATED);
};
```

### 3. Web → UI Package

**Component Import**:
```typescript
// In web app components (apps/web/src/routes/...)
import { Button } from "@workspace/ui/components/button";
import { Card, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Form, FormField, FormItem } from "@workspace/ui/components/form";

// Usage in React components
export function JobForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Job</CardTitle>
      </CardHeader>
      <Form>
        <FormField>
          <FormItem>
            {/* Form content */}
          </FormItem>
        </FormField>
        <Button type="submit">Save</Button>
      </Form>
    </Card>
  );
}
```

**Style Import**:
```typescript
// In web app root (apps/web/src/main.tsx)
import "@workspace/ui/globals.css";
```

### 4. Type Sharing Patterns

**Schema Type Import**:
```typescript
// Web app importing API types
import type { 
  insertJobsSchema, 
  selectJobsSchema, 
  listJobsSchema 
} from "@tasks-app/api/schema";

// Use in React components
interface JobFormProps {
  defaultValues?: insertJobsSchema;
  onSubmit: (data: insertJobsSchema) => Promise<void>;
}
```

**Router Type Import**:
```typescript
// API client importing router types
import type { router } from "@tasks-app/api/routes";
import { hc } from "hono/client";

// Type-safe client creation
const client = hc<router>("");
```

## Development Workflow

### 1. Adding New Entity End-to-End

When adding a new entity, changes cascade through packages:

1. **Database Schema** (`apps/api/src/db/schema/new-entity.ts`):
   ```typescript
   export const newEntities = pgTable("NewEntity", { /* ... */ });
   export const insertNewEntitySchema = createInsertSchema(newEntities);
   export const selectNewEntitySchema = createSelectSchema(newEntities);
   ```

2. **API Routes** (`apps/api/src/routes/new-entity/`):
   ```typescript
   // Create handlers, routes, and index files
   // Types automatically available from schema
   ```

3. **API Client** (automatic):
   ```typescript
   // Types automatically inferred from new routes
   // No manual changes needed
   ```

4. **Web Queries** (`apps/web/src/lib/queries/new-entity.queries.ts`):
   ```typescript
   // Import types from API package
   // Create query and mutation functions
   ```

5. **Web Components** (`apps/web/src/routes/*/new-entity/`):
   ```typescript
   // Use UI components and API queries
   // Types flow through automatically
   ```

### 2. Build Dependencies

Build order ensures proper type generation:

```bash
pnpm build  # Builds in dependency order:
# 1. packages/eslint-config
# 2. packages/ui  
# 3. apps/api (generates route types)
# 4. packages/api-client (depends on api routes)
# 5. apps/web (depends on api-client and ui)
```

### 3. Development Mode

Parallel development with watch mode:

```bash
pnpm dev  # Starts all development servers:
# - apps/api: tsx watch (hot reload)
# - apps/web: vite dev server  
# - Automatic type checking and rebuilding
```

## Package Management

### 1. Dependency Management

**Workspace Dependencies**:
```json
{
  "dependencies": {
    "@tasks-app/api": "workspace:*",
    "@workspace/ui": "workspace:*"
  }
}
```

**Version Synchronization**:
- Syncpack enforces consistent versions across workspaces
- Run `pnpm sync:check` to verify version consistency
- Run `pnpm sync:fix` to automatically fix version mismatches

### 2. Publishing Strategy

**Internal Packages**:
- All packages are `"private": true`
- Not published to npm registry
- Used only within the monorepo

**Build Outputs**:
- TypeScript compilation to `dist/` directories
- Type declarations included for proper IDE support
- Source maps for debugging

## Best Practices

### 1. Type Safety
- Always use workspace packages for shared types
- Prefer generated types over manual type definitions
- Use strict TypeScript configuration across all packages

### 2. Circular Dependencies
- Avoid circular dependencies between packages
- API package should not depend on web or api-client
- UI package should be dependency-free except for React

### 3. Package Boundaries
- Keep packages focused on single responsibilities
- Don't bypass package boundaries (e.g., direct file imports)
- Use proper package exports for controlled interfaces

### 4. Development Experience
- Fast feedback loops with watch mode
- Type errors surface immediately during development
- Hot reload preserves application state

### 5. Testing Strategy
- Unit tests within each package
- Integration tests at package boundaries
- End-to-end tests covering full data flow

## Troubleshooting

### Common Issues

**Type Errors**:
- Ensure packages are built in correct order
- Check workspace dependencies are properly referenced
- Verify TypeScript project references

**Module Resolution**:
- Use package exports rather than direct file paths
- Check pnpm workspaces configuration
- Verify build outputs exist in dist/ directories

**Development Server Issues**:
- Restart dev servers after package changes
- Clear dist/ directories and rebuild
- Check for port conflicts between services