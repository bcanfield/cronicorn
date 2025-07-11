import { drizzle } from "drizzle-orm/neon-http";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { drizzle as drizzleNode } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

loadDotenv({ path: resolve(__dirname, "../../../.env") });

function createDatabase() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error("DATABASE_URL environment variable is required");
	}

	// Use Neon serverless driver for production (Vercel/Edge environments)
	// Use postgres-js for local development
	if (process.env.VERCEL) {
		return drizzle(databaseUrl, { schema });
	} else {
		// Local development with postgres-js
		const client = postgres(databaseUrl);
		return drizzleNode(client, { schema });
	}
}

export const db = createDatabase();
export type { schema };
