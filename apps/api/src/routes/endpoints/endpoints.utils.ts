import { eq } from "drizzle-orm";

import db from "@/api/db";
import { insertSystemMessageSchema, jobs, messages } from "@/api/db/schema";

// MessageSource is defined but not exported from schema, so we'll define it here
type MessageSource = "endpointResponse" | "unknown";

/**
 * Format endpoint response data into a structured message for AI consumption
 * 
 * @param options - Object containing response data
 * @param options.endpointName - Name of the endpoint
 * @param options.url - URL of the endpoint
 * @param options.method - HTTP method used
 * @param options.requestBody - Optional request body that was sent
 * @param options.responseData - Response data from the endpoint
 * @param options.statusCode - HTTP status code from the response
 * @param options.responseTime - Response time in milliseconds
 * @param options.headers - Response headers as key-value pairs
 * @param options.success - Whether the request was successful
 * @param options.errorMessage - Optional error message if the request failed
 * @returns Formatted message content string
 */
export function formatEndpointResponseMessage({
  endpointName,
  url,
  method,
  requestBody,
  responseData,
  statusCode,
  responseTime,
  headers,
  success,
  errorMessage,
}: {
  endpointName: string;
  url: string;
  method: string;
  requestBody?: unknown;
  responseData?: unknown;
  statusCode?: number;
  responseTime?: number;
  headers?: Record<string, string>;
  success: boolean;
  errorMessage?: string;
}): string {
  const timestamp = new Date().toISOString();
  
  // Format the message in a structured way that's easy for AI to parse
  let message = `## Endpoint Execution: ${endpointName}\n\n`;
  message += `**Timestamp:** ${timestamp}\n`;
  message += `**Status:** ${success ? "✅ Success" : "❌ Failed"}\n`;
  message += `**URL:** ${url}\n`;
  message += `**Method:** ${method}\n`;
  
  // Include timing information if available
  if (responseTime !== undefined) {
    message += `**Response Time:** ${responseTime}ms\n`;
  }
  
  // Include status code if available
  if (statusCode !== undefined) {
    message += `**Status Code:** ${statusCode}\n`;
  }
  
  // Format request body if present
  if (requestBody !== undefined) {
    message += "\n### Request Body\n```json\n";
    try {
      message += JSON.stringify(requestBody, null, 2);
    } catch {
      message += String(requestBody);
    }
    message += "\n```\n";
  }
  
  // Format response data if present
  if (responseData !== undefined) {
    message += "\n### Response Data\n```json\n";
    try {
      if (typeof responseData === 'string') {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(responseData);
          message += JSON.stringify(parsed, null, 2);
        } catch {
          // Not JSON, include as string
          message += responseData;
        }
      } else {
        message += JSON.stringify(responseData, null, 2);
      }
    } catch {
      message += String(responseData);
    }
    message += "\n```\n";
  }
  
  // Include headers if available
  if (headers && Object.keys(headers).length > 0) {
    message += "\n### Response Headers\n```json\n";
    message += JSON.stringify(headers, null, 2);
    message += "\n```\n";
  }
  
  // Include error message if present
  if (!success && errorMessage) {
    message += `\n### Error\n${errorMessage}\n`;
  }
  
  return message;
}

/**
 * Insert a system message into the database
 * 
 * @param content - The content of the system message
 * @param jobId - The ID of the job the message belongs to
 * @param source - The source of the message (e.g., 'endpointResponse')
 * @returns The inserted message object or null if insertion failed
 */
export async function insertSystemMessage(
  content: string, 
  jobId: string, 
  source: MessageSource = "unknown"
): Promise<{ id: string } | null> {
  try {
    // First validate if the job exists
    const jobExists = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
    
    if (!jobExists) {
      console.error(`Failed to insert system message: Job with ID ${jobId} not found`);
      return null;
    }

    // Prepare the message data
    const messageData = {
      role: "system" as const,
      content,
      jobId,
      source,
    };
    
    // Validate the message data against the schema
    const { success, error } = insertSystemMessageSchema.safeParse(messageData);
    if (!success) {
      console.error("Failed to validate system message data:", error.format());
      return null;
    }
    
    // Insert the message into the database
    const [inserted] = await db.insert(messages)
      .values(messageData)
      .returning({ id: messages.id });
    
    return inserted;
  } catch (error) {
    console.error("Error inserting system message:", error);
    return null;
  }
}
