import { and, asc, desc, eq, getTableColumns, ilike } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/api/lib/types";

import db from "@/api/db";
import { endpoints, jobs } from "@/api/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/api/lib/constants";
import { recordEndpointUsage } from "@/api/routes/endpoint-usage/endpoint-usage.utils";

import type { CreateRoute, GetOneRoute, ListRoute, PatchRoute, RemoveRoute, RunRoute } from "./endpoints.routes";

import {
  formatEndpointResponseMessage,
  insertSystemMessage,
  truncateResponseData,
  validateRequestSize,
} from "./endpoints.utils";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  // List endpoints for authenticated user's jobs
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;
  const { page, pageSize, sortBy, sortDirection, searchQuery } = c.req.valid("query");
  const offset = (page - 1) * pageSize;
  const limit = pageSize + 1;

  const cols = getTableColumns(endpoints);
  const sortColumn = cols[sortBy as keyof typeof cols];
  const result = await db
    .select()
    .from(jobs)
    .innerJoin(endpoints, eq(jobs.id, endpoints.jobId))
    .where(
      and(
        eq(jobs.userId, userId),
        searchQuery ? ilike(endpoints.name, searchQuery) : undefined,
      ),
    )
    .orderBy(
      sortDirection === "asc"
        ? asc(sortColumn)
        : desc(sortColumn),
    )
    .limit(limit)
    .offset(offset);
  const items = result.map(r => r.Endpoint);

  const hasNext = items.length > pageSize;
  return c.json({ items: items.slice(0, pageSize), hasNext }, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;
  const { jobId, ...rest } = c.req.valid("json");
  // ensure job belongs to user
  const jobRec = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  if (!jobRec || jobRec.userId !== userId) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }
  const [inserted] = await db.insert(endpoints).values({ jobId, ...rest }).returning();
  return c.json(inserted, HttpStatusCodes.OK);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;
  const { id } = c.req.valid("param");

  const [found] = await db
    .select()
    .from(jobs)
    .innerJoin(endpoints, eq(jobs.id, endpoints.jobId))
    .where(and(eq(endpoints.id, id), eq(jobs.userId, userId)));
  if (!found?.Endpoint) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }
  return c.json(found.Endpoint, HttpStatusCodes.OK);
};

export const patch: AppRouteHandler<PatchRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const updates = c.req.valid("json");
  if (Object.keys(updates).length === 0) {
    return c.json(
      {
        success: false,
        error: {
          issues: [
            { code: ZOD_ERROR_CODES.INVALID_UPDATES, path: [], message: ZOD_ERROR_MESSAGES.NO_UPDATES },
          ],
          name: "ZodError",
        },
      },
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    );
  }
  // ensure endpoint belongs to authenticated user via job ownership
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;
  const check = await db
    .select()
    .from(endpoints)
    .innerJoin(jobs, eq(endpoints.jobId, jobs.id))
    .where(
      and(
        eq(endpoints.id, id),
        eq(jobs.userId, userId),
      ),
    );
  if (check.length === 0) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }
  const [updated] = await db.update(endpoints).set(updates).where(eq(endpoints.id, id)).returning();
  return c.json(updated, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;

  const result = await db
    .select()
    .from(endpoints)
    .innerJoin(jobs, eq(endpoints.jobId, jobs.id))
    .where(
      and(
        eq(endpoints.id, id),
        eq(jobs.userId, userId),
      ),
    );

  if (result.length === 0) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  await db.delete(endpoints).where(eq(endpoints.id, id));
  return c.body(null, HttpStatusCodes.NO_CONTENT);
};

/**
 * Execute an HTTP request using the endpoint's configuration
 *
 * This handler runs an endpoint by:
 * 1. Verifying that the endpoint exists and belongs to the authenticated user
 * 2. Making an HTTP request to the endpoint's URL using its configured method and bearer token
 * 3. Adding an optional request body if provided and applicable to the HTTP method
 * 4. Tracking request timing and handling timeouts
 * 5. Processing and returning the response with detailed metadata
 * 6. Storing the execution result as a system message in the database
 *
 * Response includes:
 * - success: boolean indicating if the request returned a successful status code
 * - message: descriptive message about the request result
 * - data: parsed response body (as JSON if possible, otherwise as text)
 * - statusCode: HTTP status code from the response
 * - responseTime: request duration in milliseconds
 * - headers: response headers as key-value pairs
 *
 * @param c - Context containing request and authentication information
 * @returns HTTP response with execution results
 */
export const run: AppRouteHandler<RunRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const { requestBody } = await c.req.json() || {};
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;

  // Fetch the endpoint with user ownership verification
  const result = await db
    .select()
    .from(endpoints)
    .innerJoin(jobs, eq(endpoints.jobId, jobs.id))
    .where(
      and(
        eq(endpoints.id, id),
        eq(jobs.userId, userId),
      ),
    );

  if (result.length === 0) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  const endpoint = result[0].Endpoint;
  const jobId = endpoint.jobId;

  // Validate request size if applicable
  if (requestBody && ["POST", "PUT", "PATCH"].includes(endpoint.method)) {
    const { valid, actualSize, errorMessage } = validateRequestSize(
      requestBody,
      endpoint.maxRequestSizeBytes || 1048576, // Default: 1MB
    );

    if (!valid) {
      // Create error message and store it in the database
      const messageContent = formatEndpointResponseMessage({
        endpointName: endpoint.name,
        url: endpoint.url,
        method: endpoint.method,
        requestBody,
        success: false,
        errorMessage: `Request size validation failed: ${errorMessage}`,
      });

      // Store as system message - non-blocking
      insertSystemMessage(messageContent, jobId, "endpointResponse")
        .catch((error) => {
          console.error("Failed to store endpoint request validation error as system message:", error);
        });

      // Record usage metrics for request size validation error
      recordEndpointUsage({
        endpointId: endpoint.id,
        requestSizeBytes: actualSize,
        responseSizeBytes: 0, // No response in this case
        executionTimeMs: 0, // No execution time for validation error
        statusCode: 413, // Payload Too Large
        success: false,
        truncated: false,
        errorMessage: errorMessage || "Request size exceeds limit",
      }).catch((error) => {
        console.error("Failed to record endpoint usage metrics for size validation error:", error);
      });

      // Return error response with required message field
      return c.json({
        success: false as const,
        message: errorMessage || "Request size exceeds limit",
        error: {
          code: "PAYLOAD_TOO_LARGE" as const,
          details: {
            actualSize,
            maxSize: endpoint.maxRequestSizeBytes || 1048576,
          },
        },
      }, 413); // 413 Payload Too Large
    }
  }

  let success = false;
  let responseData;
  let statusCode;
  let responseTime;
  const responseHeaders: Record<string, string> = {};
  let errorMessage;
  let responseSizeInfo: {
    actualSize: number;
    truncated: boolean;
  } | undefined;

  try {
    // Prepare request headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add bearer token if available
    if (endpoint.bearerToken) {
      headers.Authorization = `Bearer ${endpoint.bearerToken}`;
    }

    // Track request timing
    const startTime = performance.now();

    // Execute the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), endpoint.timeoutMs || 5000);

    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers,
      body: requestBody && ["POST", "PUT", "PATCH"].includes(endpoint.method)
        ? JSON.stringify(requestBody)
        : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const endTime = performance.now();
    responseTime = Math.round(endTime - startTime);

    // Process response
    const contentType = response.headers.get("content-type");

    // Parse response based on content type
    if (contentType?.includes("application/json")) {
      responseData = await response.json();
    }
    else {
      responseData = await response.text();
    }

    // Check response size and truncate if needed
    const maxResponseSize = endpoint.maxResponseSizeBytes || 5242880; // Default: 5MB
    const truncationResult = truncateResponseData(responseData, maxResponseSize);

    responseData = truncationResult.data;
    responseSizeInfo = {
      actualSize: truncationResult.originalSize,
      truncated: truncationResult.truncated,
    };

    // Add a note about truncation if applicable
    if (truncationResult.truncated) {
      console.warn(
        `Response for endpoint ${endpoint.id} was truncated: `
        + `${truncationResult.originalSize} bytes truncated to ${truncationResult.truncatedSize} bytes`,
      );
    }

    // Convert headers to object
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    success = response.ok;
    statusCode = response.status;
    errorMessage = success ? undefined : `Request failed with status: ${response.status}`;

    // Format the response message and store it in the database
    const messageContent = formatEndpointResponseMessage({
      endpointName: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      requestBody,
      responseData,
      statusCode,
      responseTime,
      headers: responseHeaders,
      success,
      errorMessage,
    });

    // Store as system message - non-blocking, we don't need to wait for this
    insertSystemMessage(messageContent, jobId, "endpointResponse")
      .catch((error) => {
        console.error("Failed to store endpoint response as system message:", error);
      });

    // Record usage metrics - non-blocking, we don't need to wait for this
    const requestSize = requestBody ? validateRequestSize(requestBody, Infinity).actualSize : 0;
    const responseSize = responseSizeInfo?.actualSize || 0;

    recordEndpointUsage({
      endpointId: endpoint.id,
      requestSizeBytes: requestSize,
      responseSizeBytes: responseSize,
      executionTimeMs: responseTime || 0,
      statusCode,
      success,
      truncated: responseSizeInfo?.truncated || false,
      errorMessage: success ? undefined : errorMessage,
    }).catch((error) => {
      console.error("Failed to record endpoint usage metrics:", error);
    });

    return c.json({
      success,
      message: success ? "Request executed successfully" : errorMessage,
      data: responseData,
      statusCode,
      responseTime,
      headers: responseHeaders,
      sizes: {
        requestSize,
        responseSize,
        truncated: responseSizeInfo?.truncated || false,
      },
    }, HttpStatusCodes.OK);
  }
  catch (error) {
    errorMessage = error instanceof Error ? error.message : "An unknown error occurred";

    // Format the error message and store it in the database
    const messageContent = formatEndpointResponseMessage({
      endpointName: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      requestBody,
      success: false,
      errorMessage,
    });

    // Store as system message - non-blocking, we don't need to wait for this
    insertSystemMessage(messageContent, jobId, "endpointResponse")
      .catch((err) => {
        console.error("Failed to store endpoint error as system message:", err);
      });

    // Record usage metrics for error case
    const requestSize = requestBody ? validateRequestSize(requestBody, Infinity).actualSize : 0;

    recordEndpointUsage({
      endpointId: endpoint.id,
      requestSizeBytes: requestSize,
      responseSizeBytes: 0, // No response in error case
      executionTimeMs: responseTime || 0,
      statusCode: undefined,
      success: false,
      truncated: false,
      errorMessage,
    }).catch((error) => {
      console.error("Failed to record endpoint usage metrics for error:", error);
    });

    return c.json({
      success: false,
      message: errorMessage,
      sizes: {
        requestSize,
      },
    }, HttpStatusCodes.OK); // We still return 200 OK but with success: false to differentiate from API errors
  }
};
