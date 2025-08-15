import { reset } from "drizzle-seed";

import db from "@/api/db/index.js";
import seed from "@/api/db/seed/seed.js";
import { DEV_USER } from "@/api/lib/dev-user.js";

import * as schema from "./schema.js";

async function resetDb(seedData = false) {
  // eslint-disable-next-line no-console
  console.log("Resetting database...");
  await reset(db, schema);
  // Insert dev user
  // eslint-disable-next-line no-console
  console.log("📝 Seeding dev user...");
  await db.insert(schema.users).values({ ...DEV_USER }).onConflictDoNothing();
  if (seedData) {
    await seed();
  }
  // eslint-disable-next-line no-console
  console.log("Database reset completed.");
}

export default resetDb;
