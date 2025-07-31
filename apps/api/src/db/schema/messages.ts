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

// For user messages, we want to enforce a string content
const userMessageSchema = z.object({
  role: z.literal("user"),
  content: z.string(),
  jobId: z.string().uuid(),
});

// For insert / update from web ui, the role has to be user
export const insertMessagesSchema = userMessageSchema;
export type insertMessagesSchema = z.infer<typeof insertMessagesSchema>;

// We have a created schema for messages that includes the ID - but is strictly scoped to the user role and content
export const createdMessagesSchema = z.object({
  ...userMessageSchema.shape,
  id: z.string().uuid(),
});
export type createdMessagesSchema = z.infer<typeof createdMessagesSchema>;

export const patchMessagesSchema = userMessageSchema;
export type patchMessagesSchema = z.infer<typeof patchMessagesSchema>;

// Schema for listing messages with pagination, sorting, and optional search
export const MESSAGE_SORT_KEYS = ["role", "createdAt", "updatedAt"] as const;
export const listMessagesSchema = z.object({
  sortBy: z.enum(MESSAGE_SORT_KEYS).default("createdAt").describe("Field to sort by"),
  sortDirection: sortDirectionSchema,
  page: pageSchema,
  pageSize: pageSizeSchema,
  searchQuery: z.string().optional().describe("Search query for message content"),
});

export type listMessagesSchema = z.infer<typeof listMessagesSchema>;

export const listMessagesByJobIdSchema = z.object({
  jobId: z.string().uuid().describe("Filter messages by job ID"),
  ...listMessagesSchema.shape, // Include pagination and sorting
});
export type listMessagesByJobIdSchema = z.infer<typeof listMessagesByJobIdSchema>;
