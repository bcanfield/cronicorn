import * as schema from "./schema.js";
import { db } from "./db.js";
import { reset } from "drizzle-seed";

async function main() {
  await reset(db, schema);
}
main();
