import { reset } from "drizzle-seed";
import { db } from ".";
import * as schema from "./schema";

async function main() {
	console.log("🌱 Starting database reset...");

	try {
		await reset(db, schema);
		console.log("✅ Database reset successfully!");
		// exit process gracefully
		process.exit(0);
	} catch (error) {
		console.error("❌ Error during database seeding:", error);
		process.exit(1);
	}
}

main();
