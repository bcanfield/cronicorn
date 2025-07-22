# Code Organization & Conventions

This document describes the directory layout, naming conventions, and development workflow for adding end-to-end features in the full-stack web application. AI agents can follow these guidelines to implement new functionality from database to UI.

## Table of Contents

- [Code Organization \& Conventions](#code-organization--conventions)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [API (`apps/api`)](#api-appsapi)
    - [Database Schema (`apps/api/src/db`)](#database-schema-appsapisrcdb)
    - [Routes \& Handlers (`apps/api/src/routes`)](#routes--handlers-appsapisrcroutes)
    - [Tests (`apps/api/src/routes/<entity>`)](#tests-appsapisrcroutesentity)
  - [Frontend (`apps/web`)](#frontend-appsweb)
    - [Data Fetching \& Queries (`apps/web/src/lib/queries`)](#data-fetching--queries-appswebsrclibqueries)
    - [Routing \& Pages (`apps/web/src/routes`)](#routing--pages-appswebsrcroutes)
    - [Components \& State](#components--state)
  - [Adding a New Feature (End-to-End)](#adding-a-new-feature-end-to-end)
  - [Shadcn components (`packages/ui`)](#shadcn-components-packagesui)

## Project Overview

* **Monorepo:** Managed by pnpm workspaces

## API (`apps/api`)

**Framework:** [Hono](https://hono.dev)
**ORM & Migrations:** Drizzle

### Database Schema (`apps/api/src/db`)

* Drizzle schema files (`schema.ts`) defining tables & relations

### Routes & Handlers (`apps/api/src/routes`)

* Grouped by entity: `routes/<entity>`

  * `entity.handlers.ts`: DB operations & business logic
  * `entity.routes.ts`: REST endpoints (`GET`, `POST`, `PUT`, `DELETE`)
  * `index.ts`: Mounts routes to the Hono app

### Tests (`apps/api/src/routes/<entity>`)

* `entity.test.ts`: Unit tests for handlers (Vitest)
* Test config in `apps/api/vitest.config.ts`

## Frontend (`apps/web`)

**Framework:** React + [TanStack Router](https://tanstack.com/router)
**Styling:** Tailwind CSS

### Data Fetching & Queries (`apps/web/src/lib/queries`)

* One file per entity: `<entity>.queries.ts`
* Exports typed fetch functions (e.g., `getTasks`, `createJob`)

### Routing & Pages (`apps/web/src/routes`)

* File-based routing: `<path>.tsx`
* Nested layouts: folders with `index.tsx` & `layout.tsx`

### Components & State

* Shared components in `apps/web/src/components`

## Adding a New Feature (End-to-End)

1. **Define DB Model**

   * Update Drizzle schema in `apps/api/src/db`
   * Add a migration: `pnpm drizzle-kit migrate`

2. **Implement API**

   * Create `routes/<entity>/<entity>.handlers.ts`
   * Define routes in `entity.routes.ts`
   * Mount in `routes/<entity>/index.ts`
   * Write tests in `entity.test.ts`, run `pnpm test`

3. **Frontend Integration**

   * Add fetch functions in `apps/web/src/lib/queries/<entity>.queries.ts`
   * Create page/component in `apps/web/src/routes/<entity>/index.tsx`
   * Use `loader` in tanstack `createFileRoute`
   * Build UI using `src/components`

4. **Review & Validate**

   * Ensure API tests pass
   * Manually verify frontend functionality
   * Commit, push, and open a PR with clear summary and file list

## Shadcn components (`packages/ui`)

* Holds primitive components and global.css file that are referenced to build our other components
