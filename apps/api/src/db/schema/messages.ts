import { sql } from "drizzle-orm";
import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { jobs } from "./jobs";

export const messages = pgTable("Message", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    role: text("role").notNull(),
    content: json("content").notNull(),
    jobId: text("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "string" })
        .default(sql`now()`)
        .notNull(),
    updatedAt: timestamp("updatedAt", { mode: "string" })
        .default(sql`now()`)
        .notNull(),
});
