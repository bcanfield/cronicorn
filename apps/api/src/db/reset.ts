import { reset } from "drizzle-seed";

import db from "@/api/db";

import * as schema from "./schema";

async function resetDb() {
  console.log("Resetting database...");
  await reset(db, schema);
  console.log("Database reset completed.");
}

resetDb();

export default resetDb;
