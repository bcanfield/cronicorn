import { drizzle } from "drizzle-orm/node-postgres";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://user:password@localhost:6666/db";
console.log("Connecting to database with URL:", connectionString);
export const db = drizzle({
  logger: true,
  connection: {
    connectionString,
    // ssl: true,
  },
});
