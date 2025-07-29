import { reset } from "drizzle-seed";

import db from "@/api/db";
import seed from "@/api/db/seed";

import * as schema from "./schema";

async function resetDb() {
  // eslint-disable-next-line no-console
  console.log("Resetting database...");
  await reset(db, schema);
  await seed();
  // eslint-disable-next-line no-console
  console.log("Database reset completed.");
}

export default resetDb;
