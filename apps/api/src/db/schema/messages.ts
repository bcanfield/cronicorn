/* eslint-disable ts/no-redeclare */

import { sql } from "drizzle-orm";
import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { pageSchema, pageSizeSchema, sortDirectionSchema } from "./common";
import { jobs } from "./jobs";

// Define the message roles as a union type
type MessageRole = "system" | "user" | "assistant" | "tool";

// Define content part types that match ModelMessage structure
type TextPart = {
  type: "text";
  text: string;
};

type ImagePart = {
  type: "image";
  image: string;
  mimeType?: string;
};

type FilePart = {
  type: "file";
  data: string;
  mimeType: string;
};

type ToolCallPart = {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
};

type ReasoningPart = {
  type: "reasoning";
  text: string;
  signature?: string;
};

type RedactedReasoningPart = {
  type: "redacted-reasoning";
  data: string;
};

// Content can be string or array of parts
type MessageContent =
  | string
  | Array<TextPart | ImagePart | FilePart | ToolCallPart | ReasoningPart | RedactedReasoningPart>;

export const messages = pgTable("Message", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  role: text("role").$type<MessageRole>().notNull(),
  content: json("content").$type<MessageContent>().notNull(),
  jobId: text("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "string" })
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "string" })
    .default(sql`now()`)
    .notNull(),
});

// Zod schemas for messages
export const selectMessagesSchema = createSelectSchema(messages);
export type selectMessagesSchema = z.infer<typeof selectMessagesSchema>;

// Define the message role schema
export const messageRoleSchema = z.enum(["system", "user", "assistant", "tool"]);

// Define content part schemas
export const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

export const imagePartSchema = z.object({
  type: z.literal("image"),
  image: z.string(),
  mimeType: z.string().optional(),
});

export const filePartSchema = z.object({
  type: z.literal("file"),
  data: z.string(),
  mimeType: z.string(),
});

export const toolCallPartSchema = z.object({
  type: z.literal("tool-call"),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.record(z.any()),
});

export const reasoningPartSchema = z.object({
  type: z.literal("reasoning"),
  text: z.string(),
  signature: z.string().optional(),
});

export const redactedReasoningPartSchema = z.object({
  type: z.literal("redacted-reasoning"),
  data: z.string(),
});

// Union of all content part types
export const contentPartSchema = z.union([
  textPartSchema,
  imagePartSchema,
  filePartSchema,
  toolCallPartSchema,
  reasoningPartSchema,
  redactedReasoningPartSchema,
]);

// Content can be string or array of parts
export const messageContentSchema = z.union([z.string(), z.array(contentPartSchema)]);

export const insertMessagesSchema = z.object({
  role: messageRoleSchema,
  content: messageContentSchema,
  jobId: z.string().uuid(),
});
export type insertMessagesSchema = z.infer<typeof insertMessagesSchema>;
// export const insertMessagesSchema = createInsertSchema(messages, {})
//   .omit({ id: true, createdAt: true, updatedAt: true })
//   .required({ role: true, content: true, jobId: true });
// export type insertMessagesSchema = z.infer<typeof insertMessagesSchema>;

export const patchMessagesSchema = insertMessagesSchema.partial();
export type patchMessagesSchema = z.infer<typeof patchMessagesSchema>;

// Schema for listing messages with pagination, sorting, and optional search
export const messageSortKeys = ["role", "createdAt", "updatedAt"] as const;
export const listMessagesSchema = z.object({
  sortBy: z.enum(messageSortKeys).default("createdAt").describe("Field to sort by"),
  sortDirection: sortDirectionSchema,
  page: pageSchema,
  pageSize: pageSizeSchema,
  searchQuery: z.string().optional().describe("Search query for message content"),
  jobId: z.string().optional().describe("Filter by job ID"),
});
export type listMessagesSchema = z.infer<typeof listMessagesSchema>;
