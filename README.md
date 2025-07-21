# Hono + React / Vite + Cloudflare + pnpm workspaces monorepo

A monorepo setup using pnpm workspaces with a Hono API and React / vite client deployed to Cloudflare Workers / Static Assets / D1.

Features:

- Run tasks in parallel across apps / packages with pnpm
- Hono API [proxied with vite](./apps/web/vite.config.ts) during development
- Hono [RPC client](packages/api-client/src/index.ts) built during development for faster inference
- Shared Zod validators with drizzle-zod
- Shared eslint config
- Shared tsconfig

Tech Stack:

- api
  - hono
  - hono openapi
  - authjs
  - stoker
  - drizzle
  - drizzle-zod
- web
  - react
  - vite
  - react-hook-form
  - tanstack router
- dev tooling
  - typescript
  - eslint with `@antfu/eslint-config`

Tour:

- Base [tsconfig.json](./tsconfig.json) with default settings lives in the root
- Shared packages live in [/packages] directory
  - Base [eslint.config.js](./packages/eslint-config/eslint.config.js) with default settings
- Applications live in [/apps] directory
  - Use any cli to create new apps in here
  - If cloning a git repo in here be sure to delete the `.git` folder so it is not treated as a submodule

> All pnpm commands are run from the root of the repo.

## Local Setup

### Install dependencies

```sh
pnpm i
```

### Create / Update Cloudflare D1 Database id

```sh
pnpm dlx wrangler d1 create replace-with-your-database-name-here
```

* Update `database_name` and `database_id` in [apps/api/wrangler.toml](./apps/api/wrangler.toml) with the output from wrangler.
* Update the `database_name` to match in the npm tasks [here](https://github.com/w3cj/monorepo-example-tasks-app/blob/main/apps/api/package.json#L18)

### Run DB migrations locally

```sh
pnpm run -r db:migrate:local
```

### Start Apps

```sh
pnpm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

All requests to `/api` will be proxied to the hono server running on [http://localhost:8787](http://localhost:8787)

## Production Setup

### Run DB migrations on Cloudflare D1

```sh
pnpm run -r db:migrate:remote
```

### Deploy

```sh
pnpm run deploy
```

## Tasks

### Lint

```sh
pnpm run lint
```

### Test

```sh
pnpm run test
```

### Build

```sh
pnpm run build
```
