import db from "@/api/db/index";
import { DEV_USER } from "@/api/lib/dev-user";

import * as schema from "./schema";

async function main() {
    console.log("🌱 Starting database seed...");
    // insert a dev user
    await db.insert(schema.users).values({ ...DEV_USER });

    // try {
    //     await seed(db, schema, { count: 10 });
    //     console.log("✅ Database seeded successfully!");
    //     process.exit(0);
    // }
    // catch (error) {
    //     console.error("❌ Error during database seeding:", error);
    //     process.exit(1);
    // }
}

main();
