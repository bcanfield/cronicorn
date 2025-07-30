import {
  boolean,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./auth";

export const apiKeys = pgTable("api_key", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  secret: text("secret").notNull(),
  lastUsedAt: timestamp("lastUsedAt", { mode: "date" }),
  expiresAt: timestamp("expiresAt", { mode: "date" }),
  revoked: boolean("revoked").default(false),
  createdAt: timestamp("createdAt", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  scopes: text("scopes").array(), // Array of permission scopes for the API key
  description: text("description"),
});
