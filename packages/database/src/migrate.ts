import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const migrationClient = postgres(DATABASE_URL, { max: 1 });
const db: PostgresJsDatabase = drizzle(migrationClient);

const main = async () => {
  console.log(`Migrating database. Using URL: ${DATABASE_URL}`);
  await migrate(db, { migrationsFolder: "packages/database/drizzle" });
  await migrationClient.end();
  console.log("Database migrated successfully!");
};

main();
