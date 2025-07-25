import { reset } from "drizzle-seed";

import db from "@/api/db";

import * as schema from "./schema";

async function resetDb() {
  // eslint-disable-next-line no-console
  console.log("Resetting database...");
  await reset(db, schema);
  // eslint-disable-next-line no-console
  console.log("Database reset completed.");
}

// resetDb();

export default resetDb;
