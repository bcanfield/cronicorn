#!/bin/sh
pnpm run migrate:prod
node /app/apps/api/dist/src/index.js