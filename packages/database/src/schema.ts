import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  json,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

// Enums
export const jobStatusEnum = pgEnum("JobStatus", [
  "ACTIVE",
  "PAUSED",
  "ARCHIVED",
]);

// Tables
export const accounts = pgTable(
  "Account",
  {
    id: text("cuid")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId").notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    providerProviderAccountIdUnique: unique().on(
      table.provider,
      table.providerAccountId
    ),
  })
);

export const sessions = pgTable("Session", {
  id: text("cuid")
    .primaryKey()
    .$defaultFn(() => createId()),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: text("userId").notNull(),
  expires: timestamp("expires").notNull(),
});

export const users = pgTable("User", {
  id: text("cuid")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
});

export const verificationTokens = pgTable(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires").notNull(),
  },
  (table) => ({
    identifierTokenUnique: unique().on(table.identifier, table.token),
  })
);

export const apiKeys = pgTable("ApiKey", {
  id: text("cuid")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  userId: text("userId").notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`now()`)
    .notNull(),
  lastUsed: timestamp("lastUsed"),
});

export const jobs = pgTable("Job", {
  id: text("cuid")
    .primaryKey()
    .$defaultFn(() => createId()),
  definitionNL: text("definitionNL").notNull(),
  nextRunAt: timestamp("nextRunAt"),
  status: jobStatusEnum("status").default("PAUSED").notNull(),
  locked: boolean("locked").default(false).notNull(),
  userId: text("userId"),
  inputTokens: integer("inputTokens").default(0).notNull(),
  outputTokens: integer("outputTokens").default(0).notNull(),
  totalTokens: integer("totalTokens").default(0).notNull(),
  reasoningTokens: integer("reasoningTokens").default(0).notNull(),
  cachedInputTokens: integer("cachedInputTokens").default(0).notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updatedAt")
    .default(sql`now()`)
    .notNull(),
});

export const contextEntries = pgTable(
  "ContextEntry",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    jobId: text("jobId").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("createdAt")
      .default(sql`now()`)
      .notNull(),
  },
  (table) => ({
    jobIdIndex: index("ContextEntry_jobId_idx").on(table.jobId),
  })
);

export const endpoints = pgTable("Endpoint", {
  id: text("cuid")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  url: text("url").notNull(),
  method: text("method").default("GET").notNull(),
  bearerToken: text("bearerToken"),
  requestSchema: json("requestSchema"),
  jobId: text("jobId").notNull(),
  timeoutMs: integer("timeoutMs").default(5000),
  fireAndForget: boolean("fireAndForget").default(false).notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updatedAt")
    .default(sql`now()`)
    .notNull(),
});

export const messages = pgTable("Message", {
  id: text("cuid")
    .primaryKey()
    .$defaultFn(() => createId()),
  role: text("role").notNull(),
  content: json("content").notNull(),
  jobId: text("jobId").notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updatedAt")
    .default(sql`now()`)
    .notNull(),
});

// Relations
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  apiKeys: many(apiKeys),
  jobs: many(jobs),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
  endpoints: many(endpoints),
  messages: many(messages),
  contextEntries: many(contextEntries),
}));

export const contextEntriesRelations = relations(contextEntries, ({ one }) => ({
  job: one(jobs, {
    fields: [contextEntries.jobId],
    references: [jobs.id],
  }),
}));

export const endpointsRelations = relations(endpoints, ({ one }) => ({
  job: one(jobs, {
    fields: [endpoints.jobId],
    references: [jobs.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  job: one(jobs, {
    fields: [messages.jobId],
    references: [jobs.id],
  }),
}));

// Type exports
export const InsertUsersSchema = createInsertSchema(users, {
  // Ensure dates can be parsed from strings when coming via json
  emailVerified: z.coerce.date(),
});

export const UpdateUsersSchema = InsertUsersSchema.partial().omit({ id: true });

export const UserSchema = createSelectSchema(users);
export type User = z.infer<typeof UserSchema>;
export type NewUser = z.infer<typeof InsertUsersSchema>;

// Add Job schemas
export const InsertJobsSchema = createInsertSchema(jobs);
export const UpdateJobsSchema = InsertJobsSchema.partial().omit({ id: true });
export const JobSchema = createSelectSchema(jobs);
export type Job = z.infer<typeof JobSchema>;
export type NewJob = z.infer<typeof InsertJobsSchema>;

// Add Account schemas
export const InsertAccountsSchema = createInsertSchema(accounts);
export const UpdateAccountsSchema = InsertAccountsSchema.partial().omit({
  id: true,
});
export const AccountSchema = createSelectSchema(accounts);
export type Account = z.infer<typeof AccountSchema>;
export type NewAccount = z.infer<typeof InsertAccountsSchema>;

// Add Session schemas
export const InsertSessionsSchema = createInsertSchema(sessions);
export const UpdateSessionsSchema = InsertSessionsSchema.partial().omit({
  id: true,
});
export const SessionSchema = createSelectSchema(sessions);
export type Session = z.infer<typeof SessionSchema>;
export type NewSession = z.infer<typeof InsertSessionsSchema>;

// Add VerificationToken schemas
export const InsertVerificationTokensSchema =
  createInsertSchema(verificationTokens);
export const UpdateVerificationTokensSchema =
  InsertVerificationTokensSchema.partial().omit({
    identifier: true,
    token: true,
  });
export const VerificationTokenSchema = createSelectSchema(verificationTokens);
export type VerificationToken = z.infer<typeof VerificationTokenSchema>;
export type NewVerificationToken = z.infer<
  typeof InsertVerificationTokensSchema
>;

// Add ApiKey schemas
export const InsertApiKeysSchema = createInsertSchema(apiKeys);
export const UpdateApiKeysSchema = InsertApiKeysSchema.partial().omit({
  id: true,
});
export const ApiKeySchema = createSelectSchema(apiKeys);
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type NewApiKey = z.infer<typeof InsertApiKeysSchema>;

// Add ContextEntry schemas
export const InsertContextEntriesSchema = createInsertSchema(contextEntries);
export const UpdateContextEntriesSchema =
  InsertContextEntriesSchema.partial().omit({ id: true });
export const ContextEntrySchema = createSelectSchema(contextEntries);
export type ContextEntry = z.infer<typeof ContextEntrySchema>;
export type NewContextEntry = z.infer<typeof InsertContextEntriesSchema>;

// Add Endpoint schemas
export const InsertEndpointsSchema = createInsertSchema(endpoints);
export const UpdateEndpointsSchema = InsertEndpointsSchema.partial().omit({
  id: true,
});
export const EndpointSchema = createSelectSchema(endpoints);
export type Endpoint = z.infer<typeof EndpointSchema>;
export type NewEndpoint = z.infer<typeof InsertEndpointsSchema>;

// Add Message schemas
export const InsertMessagesSchema = createInsertSchema(messages);
export const UpdateMessagesSchema = InsertMessagesSchema.partial().omit({
  id: true,
});
export const MessageSchema = createSelectSchema(messages);
export type Message = z.infer<typeof MessageSchema>;
export type NewMessage = z.infer<typeof InsertMessagesSchema>;

// export type Account = typeof accounts.$inferSelect;
// export type NewAccount = typeof accounts.$inferInsert;
// export type Session = typeof sessions.$inferSelect;
// export type NewSession = typeof sessions.$inferInsert;
// export type User = typeof users.$inferSelect;
// export type NewUser = typeof users.$inferInsert;
// export type VerificationToken = typeof verificationTokens.$inferSelect;
// export type NewVerificationToken = typeof verificationTokens.$inferInsert;
// export type ApiKey = typeof apiKeys.$inferSelect;
// export type NewApiKey = typeof apiKeys.$inferInsert;
// export type Job = typeof jobs.$inferSelect;
// export type NewJob = typeof jobs.$inferInsert;
// export type ContextEntry = typeof contextEntries.$inferSelect;
// export type NewContextEntry = typeof contextEntries.$inferInsert;
// export type Endpoint = typeof endpoints.$inferSelect;
// export type NewEndpoint = typeof endpoints.$inferInsert;
// export type Message = typeof messages.$inferSelect;
// export type NewMessage = typeof messages.$inferInsert;
// export type JobStatus = (typeof jobStatusEnum.enumValues)[number];
