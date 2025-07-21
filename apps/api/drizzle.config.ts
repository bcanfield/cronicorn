import { defineConfig } from "drizzle-kit";

import env from "@/api/env";

export default defineConfig({
  schema: env.NODE_ENV === "production" ? "./src/db/schema.js" : "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
