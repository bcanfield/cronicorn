import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

// Load root .env file
// const result = loadDotenv({ path: resolve(__dirname, "../../../.env") });

// if (result.error) {
// 	console.error("⚠️  Failed to load .env:", result.error);
// 	process.exit(1);
// }
export { prisma } from "./client"; // exports instance of prisma
export * from "../generated/prisma"; // exports generated types from prisma
