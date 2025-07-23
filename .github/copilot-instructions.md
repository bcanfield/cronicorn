# Code Organization & Developer Search Guide

*A concise blueprint for AI agents and developers to locate, understand, and extend features end-to-end.*

---

## 🗂️ Project Overview

* **Monorepo** managed by **pnpm workspaces**
* **TypeScript** throughout
* **Shared types** in `packages/types`
* **Env vars** in root `.env`, loaded via `dotenv`

* Type Check: Run pnpm typecheck from the repo root to verify TypeScript types

---

## 🔍 Search Cheat Sheet

Use your editor/CLI’s search to quickly locate code by entity name or feature:

| Feature       | Search Pattern                         | Directory                                      |
| ------------- | -------------------------------------- | ---------------------------------------------- |
| DB Model      | `schema.ts`                            | `apps/api/src/db/`                             |
| Entity Folder | `<entity>`                             | `apps/api/src/routes/`, `apps/web/src/routes/` |
| Handlers      | `<entity>.handlers.ts`                 | `apps/api/src/routes/<entity>/`                |
| Routes        | `<entity>.routes.ts`                   | `apps/api/src/routes/<entity>/`                |
| Route Mount   | `index.ts` (inside entity folder)      | `apps/api/src/routes/<entity>/index.ts`        |
| Tests         | `<entity>.test.ts`                     | `apps/api/src/routes/<entity>/`                |
| Migrations    | `*.ts` in `migrations/`                | `apps/api/src/db/migrations/`                  |
| Fetch Queries | `<entity>.queries.ts`                  | `apps/web/src/lib/queries/`                    |
| Page Route    | `<entity>.tsx` or `<entity>/index.tsx` | `apps/web/src/routes/`                         |
| Components    | `<Component>.tsx`                      | `apps/web/src/components/`                     |

---

## 🧩 API (`apps/api`)

**Framework:** [Hono](https://hono.dev)
**ORM & Migrations:** Drizzle

### 1. Database Schema

* Path: `apps/api/src/db/schema.ts`
* Contains table definitions: `export const jobs = pgTable('jobs', { ... })`
* Migration scripts: `apps/api/src/db/migrations/<timestamp>_add_jobs.ts`

### 2. Routes & Handlers

* Parent directory: `apps/api/src/routes/<entity>/`

  * **`<entity>.handlers.ts`**: CRUD + business logic, imports Drizzle client
  * **`<entity>.routes.ts`**: REST endpoints (GET, POST, PUT, DELETE)
  * **`index.ts`**: `app.route('/jobs', jobsRoutes)` mounts

### 3. Auth

**Library:** [hono/auth-js](https://www.npmjs.com/package/@hono/auth-js)


### 4. Tests

* Unit tests for handlers: `apps/api/src/routes/<entity>/<entity>.test.ts`
* Config: `apps/api/vitest.config.ts`
* Run with `pnpm test`

---

## ⚛️ Frontend (`apps/web`)

**Framework:** React + [TanStack Router](https://tanstack.com/router)
**Styling:** Tailwind CSS

### 1. Data Fetching & Queries

* Path: `apps/web/src/lib/queries/<entity>.queries.ts`
* Exports typed functions: `export function getJobs(): Promise<Job[]>`

### 2. Routing & Pages

* File-based routes: `apps/web/src/routes/jobs.tsx` or `jobs/index.tsx`
* Use `createFileRoute` + `useLoader` for data
* Nested layouts: `apps/web/src/routes/dashboard/layout.tsx`

### 3. Components & State

* Web components UI in `apps/web/src/components/` (e.g., `JobList.tsx`). 
* ShadCN primitives imported via the ui package (e.g.,) `"@workspace/ui/components/button"`)

* Global or feature state in `apps/web/src/lib/state/` or `src/hooks/` (e.g., `useJobsStore`)

---

## 🚀 Add a New Feature (Entity Example: **jobs**)

1. **DB →**

   * Update `schema.ts`: add `export const jobs = pgTable('jobs', {...})`
   * Create migration: `pnpm drizzle-kit migrate:make add_jobs`

2. **API →**

   * `mkdir apps/api/src/routes/jobs`
   * **Handlers**: `jobs.handlers.ts` (CRUD using Drizzle)
   * **Routes**: `jobs.routes.ts` (define `GET /`, `POST /`, etc.)
   * **Mount**: ensure `apps/api/src/routes/jobs/index.ts` exports router
   * **Test**: write `jobs.test.ts`, run `pnpm test`

3. **Frontend →**

   * **Queries**: `apps/web/src/lib/queries/jobs.queries.ts` → `getJobs`, `createJob`
   * **Route**: `apps/web/src/routes/jobs/index.tsx` → use `useLoader` to fetch
   * **UI**: new component `JobList.tsx`, import in page
   * **State (optional)**: `src/hooks/useJobsStore.ts`

4. **Review & Ship →**

   * Search for `jobs` with patterns above to confirm implementation
   * Run full test suite
   * Manual QA on UI routes
   * Commit, push, open PR

---

## ✅ Validation

* **Type Checking**: Run `pnpm typecheck` from the repo root to verify TypeScript types
* **Tests**: `pnpm test`
  
---

## 📦 UI Primitives (`packages/ui`)

* Core components: `Button`, `Card`, etc.
* Global styles: `global.css`
* Utilities for theming
