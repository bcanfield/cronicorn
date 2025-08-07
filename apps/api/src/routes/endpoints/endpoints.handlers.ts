import { and, asc, desc, eq, getTableColumns, ilike } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/api/lib/types";

import db from "@/api/db";
import { endpoints, jobs } from "@/api/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/api/lib/constants";

import type { CreateRoute, GetOneRoute, ListRoute, PatchRoute, RemoveRoute, RunRoute } from "./endpoints.routes";

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
    const responseTime = endTime - startTime;

    // Process response
    let responseData;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      responseData = await response.json();
    }
    else {
      responseData = await response.text();
    }

    // Convert headers to object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return c.json({
      success: response.ok,
      message: response.ok ? "Request executed successfully" : `Request failed with status: ${response.status}`,
      data: responseData,
      statusCode: response.status,
      responseTime: Math.round(responseTime),
      headers: responseHeaders,
    }, HttpStatusCodes.OK);
  }
  catch (error) {
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    }, HttpStatusCodes.OK); // We still return 200 OK but with success: false to differentiate from API errors
  }
};
