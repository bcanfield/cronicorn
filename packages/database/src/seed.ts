import { PrismaClient } from "../generated/prisma";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { DEV_USER } from "./dev-user";

// Load root .env file
// const result = loadDotenv({ path: resolve(__dirname, "../../../.env") });

// if (result.error) {
// 	console.error("⚠️  Failed to load .env:", result.error);
// 	process.exit(1);
// }

// console.log("✅ Loaded env:", result.parsed); // see what got loaded

// Now you can safely read your vars:
console.log("DATABASE_URL is", process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
	await prisma.user.upsert({
		where: { id: DEV_USER.id },
		update: { ...DEV_USER },
		create: {
			...DEV_USER,
		},
	});
}
main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
