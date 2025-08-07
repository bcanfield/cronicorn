import { eq } from "drizzle-orm";

import db from "@/api/db";
import { insertSystemMessageSchema, jobs, messages } from "@/api/db/schema";
import { calculateObjectSizeBytes, calculateStringSizeBytes, formatBytes } from "@/api/lib/size-utils";

// MessageSource is defined but not exported from schema, so we'll define it here
type MessageSource = "endpointResponse" | "unknown";

/**
 * Validate request body size against endpoint limits
 *
 * @param requestBody - The request body to validate
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns Object with validation result and formatted sizes
 */
export function validateRequestSize(requestBody: unknown, maxSizeBytes: number): {
    valid: boolean;
    actualSize: number;
    formattedActualSize: string;
    formattedMaxSize: string;
    errorMessage?: string;
} {
    if (!requestBody) {
        return {
            valid: true,
            actualSize: 0,
            formattedActualSize: "0 Bytes",
            formattedMaxSize: formatBytes(maxSizeBytes),
        };
    }

    const actualSize = calculateObjectSizeBytes(requestBody);

    return {
        valid: actualSize <= maxSizeBytes,
        actualSize,
        formattedActualSize: formatBytes(actualSize),
        formattedMaxSize: formatBytes(maxSizeBytes),
        errorMessage: actualSize > maxSizeBytes
            ? `Request body size (${formatBytes(actualSize)}) exceeds the maximum allowed size (${formatBytes(maxSizeBytes)})`
            : undefined,
    };
}

/**
 * Validate response body size against endpoint limits
 *
 * @param responseData - The response data to validate
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns Object with validation result and formatted sizes
 */
export function validateResponseSize(responseData: unknown, maxSizeBytes: number): {
    valid: boolean;
    actualSize: number;
    formattedActualSize: string;
    formattedMaxSize: string;
    truncated: boolean;
    errorMessage?: string;
} {
    if (!responseData) {
        return {
            valid: true,
            actualSize: 0,
            formattedActualSize: "0 Bytes",
            formattedMaxSize: formatBytes(maxSizeBytes),
            truncated: false,
        };
    }

    const actualSize = typeof responseData === "string"
        ? calculateStringSizeBytes(responseData)
        : calculateObjectSizeBytes(responseData);

    return {
        valid: true, // We always return valid but may truncate the response
        actualSize,
        formattedActualSize: formatBytes(actualSize),
        formattedMaxSize: formatBytes(maxSizeBytes),
        truncated: actualSize > maxSizeBytes,
        errorMessage: actualSize > maxSizeBytes
            ? `Response size (${formatBytes(actualSize)}) exceeds the maximum allowed size (${formatBytes(maxSizeBytes)}). Response will be truncated.`
            : undefined,
    };
}

/**
 * Truncate response data to fit within size limits
 *
 * @param responseData - The response data to potentially truncate
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns Truncated response data and truncation metadata
 */
export function truncateResponseData(responseData: unknown, maxSizeBytes: number): {
    data: unknown;
    truncated: boolean;
    originalSize: number;
    truncatedSize: number;
} {
    if (!responseData) {
        return {
            data: responseData,
            truncated: false,
            originalSize: 0,
            truncatedSize: 0,
        };
    }

    // Calculate original size
    const originalSize = typeof responseData === "string"
        ? calculateStringSizeBytes(responseData)
        : calculateObjectSizeBytes(responseData);

    // If not exceeding limit, return as is
    if (originalSize <= maxSizeBytes) {
        return {
            data: responseData,
            truncated: false,
            originalSize,
            truncatedSize: originalSize,
        };
    }

    // Handle string responses
    if (typeof responseData === "string") {
        // Calculate approximate character limit (each char is ~2 bytes)
        const charLimit = Math.floor(maxSizeBytes / 2) - 100; // Allow some buffer for truncation message
        const truncated = `${responseData.substring(0, charLimit)}\n\n... [TRUNCATED: Response exceeded size limit] ...`;
        return {
            data: truncated,
            truncated: true,
            originalSize,
            truncatedSize: calculateStringSizeBytes(truncated),
        };
    }

    // Handle objects/arrays
    try {
        const json = JSON.stringify(responseData);
        // Calculate approximate character limit
        const charLimit = Math.floor(maxSizeBytes / 2) - 100;
        const truncatedJson = `${json.substring(0, charLimit)}\n\n... [TRUNCATED: Response exceeded size limit] ...`;

        // For objects, try to parse it back to maintain the structure
        try {
            const truncatedObject = JSON.parse(truncatedJson);
            return {
                data: truncatedObject,
                truncated: true,
                originalSize,
                truncatedSize: calculateObjectSizeBytes(truncatedObject),
            };
        }
        catch {
            // If parsing fails, return as string
            return {
                data: truncatedJson,
                truncated: true,
                originalSize,
                truncatedSize: calculateStringSizeBytes(truncatedJson),
            };
        }
    }
    catch {
        // If stringification fails, create a simple truncation message
        const truncationMessage = {
            _truncated: true,
            _message: `Original response exceeded the size limit of ${formatBytes(maxSizeBytes)}`,
        };
        return {
            data: truncationMessage,
            truncated: true,
            originalSize,
            truncatedSize: calculateObjectSizeBytes(truncationMessage),
        };
    }
}

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
        }
        catch {
            message += String(requestBody);
        }
        message += "\n```\n";
    }

    // Format response data if present
    if (responseData !== undefined) {
        message += "\n### Response Data\n```json\n";
        try {
            if (typeof responseData === "string") {
                // Try to parse as JSON first
                try {
                    const parsed = JSON.parse(responseData);
                    message += JSON.stringify(parsed, null, 2);
                }
                catch {
                    // Not JSON, include as string
                    message += responseData;
                }
            }
            else {
                message += JSON.stringify(responseData, null, 2);
            }
        }
        catch {
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
    source: MessageSource = "unknown",
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
    }
    catch (error) {
        console.error("Error inserting system message:", error);
        return null;
    }
}
