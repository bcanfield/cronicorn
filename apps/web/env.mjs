import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Convert the ES module URL to a file path
const __filename = fileURLToPath(import.meta.url);
// Extract its directory
const __dirname = dirname(__filename);
// Load root .env file
loadDotenv({ path: resolve(__dirname, "../../.env") });

export const env = createEnv({
	server: {
		NEXTAUTH_URL: z.string().url().optional(),
		DATABASE_URL: z.string().min(1),
		AUTH_SECRET: z.string().min(1),
		GITHUB_ID: z.string().min(1).optional(),
		GITHUB_SECRET: z.string().min(1).optional(),

		ENABLE_DEV_AUTH: z.boolean().optional(),
	},
	client: {
		NEXT_PUBLIC_APP_URL: z.string().min(1),
	},
	runtimeEnv: {
		NEXTAUTH_URL: process.env.NEXTAUTH_URL,
		AUTH_SECRET: process.env.AUTH_SECRET,
		GITHUB_ID: process.env.GITHUB_ID,
		GITHUB_SECRET: process.env.GITHUB_SECRET,
		DATABASE_URL: process.env.DATABASE_URL,
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
	},
});
