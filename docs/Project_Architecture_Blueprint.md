# Project Architecture Blueprint

**Generated:** July 29, 2025

This document provides a comprehensive blueprint of the `cronicorn` monorepo, auto-detecting its technology stack, architectural patterns, and implementation practices. It serves as a reference for developers and AI agents to maintain consistency and guide new development.

---

## 1. Architecture Detection and Analysis

- **Monorepo Manager:** pnpm workspaces (root `pnpm-workspace.yaml`)
- **Languages & Runtimes:** TypeScript, Node.js (ESM)
- **Backend Framework:** Hono (apps/api)
- **ORM & Migrations:** Drizzle (apps/api/src/db)
- **Frontend Framework:** React + Vite + TanStack Router (apps/web)
- **Styling:** Tailwind CSS with theme variables defined in `packages/ui`
- **Shared Libraries:**
  - `packages/types`: shared TypeScript types
  - `packages/ui`: UI primitives and global styles

Configuration files scanned:
- `package.json`, `tsconfig.json`, `docker-compose.yml`
- Framework configs: `eslintrc`, `vitest.config.ts`, `vite.config.ts`, `drizzle.config.ts`

---

## 2. Architectural Overview

The architecture follows a **layered monolith** within a monorepo:

1. **Root orchestration** (pnpm workspaces)
2. **Core packages** (`types`, `ui`) providing cross-application utilities
3. **API service** (`apps/api`): HTTP REST endpoints using Hono, business logic in handlers, Drizzle-driven DB layer
4. **Web client** (`apps/web`): React SPA with file-based routing, data loaders calling the API
5. **Deployment**: Docker Compose orchestrates `api`, `web`, and `nginx` proxy

Key principles:
- **Separation of concerns** between API, UI, and shared libraries
- **Type safety** end-to-end via shared TypeScript types
- **Consistency** enforced by centralized lint, TypeScript, and test configs

---

## 3. Architecture Visualization (Textual)

- **Subsystems:** Root orchestrator, API service, Web client, Shared libraries, Infrastructure
- **Data Flow:** Browser → (HTTP) → API → (Drizzle) → PostgreSQL
- **Component Interactions:**
  - `apps/web` imports types from `packages/types`
  - UI components from `packages/ui` consumed by web pages
  - API handlers interact with `db/schema.ts` and migrations in `apps/api`

---

## 4. Core Architectural Components

### 4.1 Root Orchestrator
- **Purpose:** Bootstraps workspaces, and caching
- **Structure:** monorepo config files, workspace-level scripts
- **Interactions:** Executes build/test/typecheck tasks across packages

### 4.2 Shared Types (`packages/types`)
- **Purpose:** Centralizes cross-service interfaces and DTOs
- **Structure:** Flat `src` folder exporting `type Job`, `type User`, etc.
- **Extension:** Add new domain types as needed; always update both API and web

### 4.3 UI Primitives (`packages/ui`)
- **Purpose:** Provides reusable React components and theme variables
- **Structure:** `src/components`, `src/styles/globals.css`
- **Patterns:** Tailwind utility classes tied to theme tokens (e.g., `text-primary`)

### 4.4 API Service (`apps/api`)
- **Purpose:** Exposes REST endpoints for domain entities (e.g., jobs)
- **Internal Structure:**
  - `routes/<entity>/<entity>.handlers.ts`: CRUD logic
  - `routes/<entity>/<entity>.routes.ts`: endpoint definitions
  - `db/schema.ts`: Drizzle table definitions
  - `migrations/`: Drizzle migration scripts
- **Communication:** HTTP JSON; Hono router mounting at `/jobs`, `/users`, etc.

### 4.5 Web Client (`apps/web`)
- **Purpose:** Single-page app delivering UI workflows
- **Internal Structure:**
  - `routes/`: file-based pages using TanStack Router
  - `lib/queries`: typed fetch functions (useLoader) consuming API
  - `components/`: feature UI components
  - `config/`: client-side configuration and env handling

---

## 5. Architectural Layers and Dependencies

| Layer             | Contents                 | Depends On              |
|-------------------|--------------------------|-------------------------|
| Infrastructure    | Docker, Nginx, Env files | —                       |
| Orchestration     | pnpm scripts             | Infrastructure          |
| Packages          | `types`, `ui`            | —                       |
| API Service       | Hono, Drizzle            | `types`, Infrastructure |
| Web Client        | React, Tailwind          | `types`, `ui`, API      |

- **No circular dependencies**: each layer only references layers below it

---

## 6. Data Architecture

- **Schema Location:** `apps/api/src/db/schema.ts`
- **Entities:** Tables defined via `pgTable`, e.g., `jobs`, `users`
- **Migrations:** auto-generated via `drizzle-kit migrate:make`
- **Access Patterns:** Query builder functions in handlers; no raw SQL
- **Validation:** Lightweight request validation via DTO typings

---

## 7. Cross-Cutting Concerns Implementation

- **Authentication & Authorization:**
  - Hono middleware layers (`middlewares/`)
  - JWT/session logic in `auth-js`
- **Error Handling & Resilience:**
  - Global error handler in `app.ts`
  - Structured error responses with status codes
- **Logging & Monitoring:**
  - Console-based logs (can be extended to external services)
  - No current distributed tracing, extension point exists
- **Configuration Management:**
  - Environment variables loaded in `env.ts` via `dotenv`
  - Feature flags via simple `process.env` checks

---

## 8. Service Communication Patterns

- **Protocol:** HTTP/1.1 JSON REST
- **Endpoints:** File-based routes in API; versioning not yet implemented
- **Synchronous Communication:** Web → API calls
- **Asynchronous Patterns:** None (future: background jobs)

---

## 9. Technology-Specific Architectural Patterns

### Node.js / Hono Patterns
- Middleware pipeline in `app.ts`
- Dependency injection via module imports
- Drizzle integration for type-safe queries

### React Patterns
- File-based routes and loaders
- Hook-driven data fetching (`useLoader` + `lib/queries`)
- Component composition with UI primitives

---

## 10. Implementation Patterns

- **Interface Design:** Shared DTOs in `packages/types`, full coverage of request and response shapes
- **Service Implementation:** Handler functions per entity, isolated from framework logic
- **Repository Implementation:** Direct Drizzle client usage; query builder patterns
- **Controller/API:** Routes delegate directly to handler methods; minimal glue code
- **Domain Model:** Entities as plain TypeScript types, no rich domain objects

---

## 11. Testing Architecture

- **Framework:** Vitest (API and Web configs)
- **API Tests:** In `apps/api/src/routes/<entity>/<entity>.test.ts`
- **Web Tests:** Playwright not yet implemented; unit tests via Vitest in `apps/web`
- **Fixtures:** No shared fixtures yet, tests are independent

---

## 12. Deployment Architecture

- **Docker Compose:** `docker-compose.yml` orchestrates `api`, `web`, `nginx`, and PostgreSQL
- **Build Scripts:** `docker/build.sh`, `start-api.sh`
- **NGINX:** Reverse proxy with TLS and caching in `docker/nginx.conf`

---

## 13. Extension and Evolution Patterns

- **Adding Entities:** Follow pattern in `apps/api`: create schema, handlers, routes, tests; update shared types and web queries
- **Extending UI:** Add new components in `packages/ui` and consume in `apps/web`
- **Configuration:** New env vars in root `.env`, load via `env.ts`

---

## 14. Architectural Pattern Examples

```ts
// Example: Drizzle table and handler
import { pgTable, serial, text } from 'drizzle-orm/pg-core';
export const jobs = pgTable('jobs', { id: serial('id').primaryKey(), title: text('title') });

// Handler example
export async function listJobs(req, res) {
  const all = await db.select().from(jobs);
  return res.json(all);
}
```

---

## 15. Architectural Decision Records

- **Monorepo with pnpm:** Chosen for fast, deterministic installs across TS packages
- **Hono vs. Express:** Hono selected for minimal bundle size and middleware pipeline
- **Drizzle ORM:** Preferred for type-safe migrations and queries

---

## 16. Architecture Governance

- **Type Enforcement:** `pnpm typecheck` in CI
- **Linting:** ESLint configs at root and per-app
- **Testing:** `pnpm test` ensures API and web tests pass
- **Code Reviews:** Manual PR reviews enforce architectural guidelines

---

## 17. Blueprint for New Development

1. **Bootstrap:** `pnpm install`, update `.env`
2. **Add DB Entity**: schema, migration, types, handlers, routes, tests, web queries, UI components
3. **Validate:** `pnpm typecheck`, `pnpm test`, manual QA on UI
4. **Deploy:** Build Docker images, update compose, push to registry

**Common Pitfalls:**
- Forgetting to update shared types
- Bypassing middleware ordering in Hono
- Using custom Tailwind colors instead of theme tokens

---

