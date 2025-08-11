#!/bin/sh
bunx drizzle-kit migrate --config=/app/apps/api/dist/drizzle.config.js
bun run /app/apps/api/dist/src/index.js