import { drizzle } from "drizzle-orm/node-postgres";

const connectionString = process.env.DATABASE_URL;
console.log("Connecting to database with URL:", connectionString);
export const db = drizzle({
  logger: true,
  connection: {
    connectionString: process.env.DATABASE_URL!,
    // ssl: true,
  },
});
