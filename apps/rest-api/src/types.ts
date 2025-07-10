import { z } from "zod";

// Job Status Enum
export const JobStatusSchema = z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

// Message Role Enum
export const MessageRoleSchema = z.enum(["system", "user", "tool"]);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

// Base schemas
export const JobSchema = z.object({
	id: z.string(),
	definitionNL: z.string(),
	status: JobStatusSchema,
	nextRunAt: z.string().nullable(),
	contextEntries: z.number(),
	totalTokens: z.number(),
	inputTokens: z.number(),
	outputTokens: z.number(),
	reasoningTokens: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const MessageSchema = z.object({
	id: z.string(),
	role: MessageRoleSchema,
	content: z.string(),
	jobId: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const ContextEntrySchema = z.object({
	id: z.string(),
	jobId: z.string(),
	key: z.string(),
	value: z.string(),
	createdAt: z.string(),
});

// API Response schemas
export const JobsResponseSchema = z.object({
	jobs: z.array(JobSchema),
	total: z.number(),
	page: z.number(),
	limit: z.number(),
	hasMore: z.boolean(),
});

export const MessagesResponseSchema = z.object({
	messages: z.array(MessageSchema),
	total: z.number(),
	page: z.number(),
	limit: z.number(),
	hasMore: z.boolean(),
});

export const StatsResponseSchema = z.object({
	totalJobs: z.number(),
	messagesProcessedToday: z.number(),
	contextUpdatesLast24h: z.number(),
});

export const MetricsResponseSchema = z.object({
	tokenUsage: z.array(
		z.object({
			date: z.string(),
			input: z.number(),
			output: z.number(),
			reasoning: z.number(),
		}),
	),
	processingTime: z.array(
		z.object({
			date: z.string(),
			avgTime: z.number(),
			maxTime: z.number(),
		}),
	),
	contextSize: z.array(
		z.object({
			date: z.string(),
			avgSize: z.number(),
			maxSize: z.number(),
		}),
	),
});

// Query parameter schemas using coerce for type-safe string-to-number conversion
export const JobsQuerySchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(10),
	status: JobStatusSchema.optional(),
	search: z.string().optional(),
	sortBy: z.enum(["createdAt", "updatedAt", "nextRunAt", "totalTokens"]).default("updatedAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const MessagesQuerySchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(10),
	jobId: z.string().optional(),
	role: MessageRoleSchema.optional(),
	since: z.string().optional(), // ISO date string
});

// Inferred types
export type Job = z.infer<typeof JobSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type ContextEntry = z.infer<typeof ContextEntrySchema>;
export type JobsResponse = z.infer<typeof JobsResponseSchema>;
export type MessagesResponse = z.infer<typeof MessagesResponseSchema>;
export type StatsResponse = z.infer<typeof StatsResponseSchema>;
export type MetricsResponse = z.infer<typeof MetricsResponseSchema>;
export type JobsQuery = z.infer<typeof JobsQuerySchema>;
export type MessagesQuery = z.infer<typeof MessagesQuerySchema>;
