import { sql } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { jobs } from "./jobs";

export const contextEntries = pgTable(
    "ContextEntry",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        jobId: text("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
        key: text("key").notNull(),
        value: text("value").notNull(),
        createdAt: timestamp("createdAt", { mode: "string" })
            .default(sql`now()`)
            .notNull(),
    },
);
