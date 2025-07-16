import {
  modelMessageSchema,
  type ModelMessage,
  type SystemModelMessage,
  type UserModelMessage,
  type AssistantModelMessage,
  type ToolModelMessage,
} from "./language-model-v2-schemas";

/**
 * Parses a message from your database into a type-safe ModelMessage
 */
export function parseModelMessage(dbMessage: {
  role: string;
  content: unknown;
  [key: string]: unknown;
}): ModelMessage {
  const result = modelMessageSchema.parse({
    role: dbMessage.role,
    content: dbMessage.content,
    providerOptions: dbMessage.providerOptions,
  });

  return result;
}

/**
 * Safely parses a message from your database with error handling
 */
export function safeParseModelMessage(dbMessage: {
  role: string;
  content: unknown;
  [key: string]: unknown;
}): { success: true; data: ModelMessage } | { success: false; error: string } {
  const result = modelMessageSchema.safeParse({
    role: dbMessage.role,
    content: dbMessage.content,
    providerOptions: dbMessage.providerOptions,
  });

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      error: result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", "),
    };
  }
}

/**
 * Type guard to check if a parsed message is a specific role
 */
export function isSystemMessage(
  message: ModelMessage
): message is SystemModelMessage {
  return message.role === "system";
}

export function isUserMessage(
  message: ModelMessage
): message is UserModelMessage {
  return message.role === "user";
}

export function isAssistantMessage(
  message: ModelMessage
): message is AssistantModelMessage {
  return message.role === "assistant";
}

export function isToolMessage(
  message: ModelMessage
): message is ToolModelMessage {
  return message.role === "tool";
}

/**
 * Helper to check if content is string vs array of parts
 */
export function hasComplexContent(
  message: UserModelMessage | AssistantModelMessage
): message is (UserModelMessage | AssistantModelMessage) & {
  content: Array<any>;
} {
  return Array.isArray(message.content);
}
