import { z } from "zod";

// Base schemas for data content and provider options
const dataContentSchema = z.union([
  z.string(), // base64 string
  z.instanceof(Uint8Array),
  z.instanceof(ArrayBuffer),
  z.instanceof(Buffer),
]);

// const providerOptionsSchema = z.record(z.unknown()).optional();

// Content part schemas
const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  //   providerOptions: providerOptionsSchema,
});

const imagePartSchema = z.object({
  type: z.literal("image"),
  image: z.union([dataContentSchema, z.instanceof(URL), z.string().url()]),
  mediaType: z.string().optional(),
  //   providerOptions: providerOptionsSchema,
});

const filePartSchema = z.object({
  type: z.literal("file"),
  data: z.union([dataContentSchema, z.instanceof(URL), z.string().url()]),
  filename: z.string().optional(),
  mediaType: z.string(),
  //   providerOptions: providerOptionsSchema,
});

const reasoningPartSchema = z.object({
  type: z.literal("reasoning"),
  text: z.string(),
  //   providerOptions: providerOptionsSchema,
});

const toolCallPartSchema = z.object({
  type: z.literal("tool-call"),
  toolCallId: z.string(),
  toolName: z.string(),
  input: z.unknown(),
  //   providerOptions: providerOptionsSchema,
  providerExecuted: z.boolean().optional(),
});

const toolResultPartSchema = z.object({
  type: z.literal("tool-result"),
  toolCallId: z.string(),
  toolName: z.string(),
  output: z.unknown(), // LanguageModelV2ToolResultOutput
  //   providerOptions: providerOptionsSchema,
});

// Content type schemas
const userContentSchema = z.union([
  z.string(),
  z.array(z.union([textPartSchema, imagePartSchema, filePartSchema])),
]);

const assistantContentSchema = z.union([
  z.string(),
  z.array(
    z.union([
      textPartSchema,
      filePartSchema,
      reasoningPartSchema,
      toolCallPartSchema,
      toolResultPartSchema,
    ])
  ),
]);

const toolContentSchema = z.array(toolResultPartSchema);

// Individual message type schemas
const systemModelMessageSchema = z.object({
  role: z.literal("system"),
  content: z.string(),
  //   providerOptions: providerOptionsSchema,
});

const userModelMessageSchema = z.object({
  role: z.literal("user"),
  content: userContentSchema,
  //   providerOptions: providerOptionsSchema,
});

const assistantModelMessageSchema = z.object({
  role: z.literal("assistant"),
  content: assistantContentSchema,
  //   providerOptions: providerOptionsSchema,
});

const toolModelMessageSchema = z.object({
  role: z.literal("tool"),
  content: toolContentSchema,
  //   providerOptions: providerOptionsSchema,
});

// Main ModelMessage schema (discriminated union)
export const modelMessageSchema = z.discriminatedUnion("role", [
  systemModelMessageSchema,
  userModelMessageSchema,
  assistantModelMessageSchema,
  toolModelMessageSchema,
]);

// Type inference
export type ModelMessage = z.infer<typeof modelMessageSchema>;
export type SystemModelMessage = z.infer<typeof systemModelMessageSchema>;
export type UserModelMessage = z.infer<typeof userModelMessageSchema>;
export type AssistantModelMessage = z.infer<typeof assistantModelMessageSchema>;
export type ToolModelMessage = z.infer<typeof toolModelMessageSchema>;

// Content type exports
export type UserContent = z.infer<typeof userContentSchema>;
export type AssistantContent = z.infer<typeof assistantContentSchema>;
export type ToolContent = z.infer<typeof toolContentSchema>;

// Content part type exports
export type TextPart = z.infer<typeof textPartSchema>;
export type ImagePart = z.infer<typeof imagePartSchema>;
export type FilePart = z.infer<typeof filePartSchema>;
export type ReasoningPart = z.infer<typeof reasoningPartSchema>;
export type ToolCallPart = z.infer<typeof toolCallPartSchema>;
export type ToolResultPart = z.infer<typeof toolResultPartSchema>;
