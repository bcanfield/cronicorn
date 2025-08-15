import { drizzle } from "drizzle-orm/node-postgres";

import env from "@/api/env.js";

import * as schema from "./schema.js";

const db = drizzle(env.DATABASE_URL, { casing: "snake_case", schema });

export default db;
