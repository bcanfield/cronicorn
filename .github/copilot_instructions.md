## Repository Overview

* **pnpm workspaces** manage all packages and apps in one monorepo.

## Structure

* `packages/database`: Drizzle ORM for type-safe data access.
* `apps/api`: Hono for a lightweight REST API.

## Principles

* **DRY**: Keep shared code in central modules.
* **Separation of Concerns**: Each layer has a clear, focused role.
