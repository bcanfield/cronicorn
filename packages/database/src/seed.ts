import { PrismaClient } from "../generated/prisma";
import { DEV_USER } from "./dev-user";

// Now you can safely read your vars:
console.log("DATABASE_URL is", process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
	if (process.env.NODE_ENV === "developmemt") {
		console.log("🌱 Seeding development database...");
		await prisma.user.upsert({
			where: { id: DEV_USER.id },
			update: { ...DEV_USER },
			create: {
				...DEV_USER,
			},
		});
	}
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
