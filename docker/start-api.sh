#!/bin/sh
pnpx drizzle-kit migrate --config=/app/apps/api/dist/drizzle.config.js
node /app/apps/api/dist/src/index.js