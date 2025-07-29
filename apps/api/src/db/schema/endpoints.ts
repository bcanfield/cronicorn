import { sql } from "drizzle-orm";
import { boolean, integer, json, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { jobs } from "./jobs";

export const endpoints = pgTable("Endpoint", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    url: text("url").notNull(),
    method: text("method").default("GET").notNull(),
    bearerToken: text("bearerToken"),
    requestSchema: json("requestSchema"),
    jobId: text("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    timeoutMs: integer("timeoutMs").default(5000),
    fireAndForget: boolean("fireAndForget").default(false).notNull(),
    createdAt: timestamp("createdAt", { mode: "string" })
        .default(sql`now()`)
        .notNull(),
    updatedAt: timestamp("updatedAt", { mode: "string" })
        .default(sql`now()`)
        .notNull(),
});
