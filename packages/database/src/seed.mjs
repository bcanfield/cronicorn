import { seed } from "drizzle-seed";
import * as schema from "./schema.js";
import { db } from "./index.js";

async function main() {
	console.log("🌱 Starting database reset...");

	try {
		await seed(db, schema, { count: 10 });
		console.log("✅ Database reset successfully!");
		// exit process gracefully
		process.exit(0);
	} catch (error) {
		console.error("❌ Error during database seeding:", error);
		process.exit(1);
	}
}

main();
