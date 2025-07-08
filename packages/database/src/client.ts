import { PrismaClient } from "../generated/prisma";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

// Load root .env file
// Load root .env file
// const result = loadDotenv({ path: resolve(__dirname, "../../../.env") });

// if (result.error) {
// 	console.error("⚠️  Failed to load .env:", result.error);
// 	process.exit(1);
// }
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
