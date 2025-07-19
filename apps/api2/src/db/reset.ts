import { reset } from "drizzle-seed";

import db from "@/db";

import * as schema from "./schema";

async function main() {
  await reset(db, schema);
}
main();
