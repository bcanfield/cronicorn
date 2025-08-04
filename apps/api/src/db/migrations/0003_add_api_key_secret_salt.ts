import { sql } from "drizzle-orm";
import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";

export async function up(db: PostgresJsDatabase) {
    // Add secretSalt column to existing api_key table
    await db.execute(sql`ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "secretSalt" TEXT`);

    console.log("✅ Added secretSalt column to api_key table");
}

export async function down(db: PostgresJsDatabase) {
    // Remove the secretSalt column
    await db.execute(sql`ALTER TABLE "api_key" DROP COLUMN IF EXISTS "secretSalt"`);

    console.log("✅ Removed secretSalt column from api_key table");
}
