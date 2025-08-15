import { and, asc, between, desc, eq, getTableColumns, gte, inArray, lte } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/api/lib/types";

import db from "@/api/db/index.js";
import { endpoints, jobs } from "@/api/db/schema.js";
import { endpointUsage } from "@/api/db/schema/endpoint-usage.js";

import type {
  GetStatsRoute,
  GetTimeSeriesRoute,
  ListRoute,
} from "./endpoint-usage.routes.js";

import { getUsageStats, getUsageTimeSeries } from "./endpoint-usage.utils.js";

/**
 * List usage records with pagination and filtering
 */
export const list: AppRouteHandler<ListRoute> = async (c) => {
  // Get authenticated user
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;

  // Parse query parameters
  const {
    page,
    pageSize,
    sortBy,
    sortDirection,
    startDate,
    endDate,
    endpointId,
    success,
  } = c.req.valid("query");

  // Calculate offset and limit
  const offset = (page - 1) * pageSize;
  const limit = pageSize + 1; // Fetch one extra to determine if there's a next page

  // Build query conditions
  const conditions = [];

  // If filtering by endpointId, verify that it belongs to the authenticated user
  if (endpointId) {
    // Find the endpoint and verify ownership
    const endpointCheck = await db
      .select()
      .from(endpoints)
      .innerJoin(jobs, eq(endpoints.jobId, jobs.id))
      .where(
        and(
          eq(endpoints.id, endpointId),
          eq(jobs.userId, userId),
        ),
      );

    if (endpointCheck.length === 0) {
      // Return unauthorized rather than not found to avoid leaking information
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    conditions.push(eq(endpointUsage.endpointId, endpointId));
  }
  else {
    // If not filtering by a specific endpoint, ensure we only return usage for endpoints
    // owned by the authenticated user
    const userEndpoints = await db
      .select({ id: endpoints.id })
      .from(endpoints)
      .innerJoin(jobs, eq(endpoints.jobId, jobs.id))
      .where(eq(jobs.userId, userId));

    if (userEndpoints.length === 0) {
      // No endpoints found for this user
      return c.json({ items: [], hasNext: false }, HttpStatusCodes.OK);
    }

    // Create an array of endpoint IDs owned by the user
    const endpointIds = userEndpoints.map(e => e.id);
    conditions.push(inArray(endpointUsage.endpointId, endpointIds));
  }

  // Add date range filter if provided
  if (startDate && endDate) {
    conditions.push(between(endpointUsage.timestamp, startDate, endDate));
  }
  else if (startDate) {
    conditions.push(gte(endpointUsage.timestamp, startDate));
  }
  else if (endDate) {
    conditions.push(lte(endpointUsage.timestamp, endDate));
  }

  // Add success/failure filter if provided
  if (success !== undefined) {
    conditions.push(eq(endpointUsage.success, success === "1" ? 1 : 0));
  }

  // Apply sorting
  const cols = getTableColumns(endpointUsage);
  const sortColumn = cols[sortBy as keyof typeof cols];

  // Execute query
  const result = await db
    .select()
    .from(endpointUsage)
    .where(and(...conditions))
    .orderBy(
      sortDirection === "asc"
        ? asc(sortColumn)
        : desc(sortColumn),
    )
    .limit(limit)
    .offset(offset);

  // Check if there's a next page
  const hasNext = result.length > pageSize;

  // Include endpoint details with each usage record
  const usageWithEndpointDetails = await Promise.all(
    result.slice(0, pageSize).map(async (usage) => {
      const endpointDetail = await db
        .select({ name: endpoints.name, url: endpoints.url, method: endpoints.method })
        .from(endpoints)
        .where(eq(endpoints.id, usage.endpointId))
        .limit(1);

      return {
        ...usage,
        endpoint: endpointDetail[0] || { name: "Unknown", url: "", method: "" },
      };
    }),
  );

  return c.json({
    items: usageWithEndpointDetails,
    hasNext,
  }, HttpStatusCodes.OK);
};

/**
 * Get aggregated usage statistics
 */
export const getStats: AppRouteHandler<GetStatsRoute> = async (c) => {
  // Get authenticated user
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;

  // Parse query parameters
  const { endpointId, startDate, endDate } = c.req.valid("query");

  // If endpointId is provided, verify ownership
  if (endpointId) {
    const endpointCheck = await db
      .select()
      .from(endpoints)
      .innerJoin(jobs, eq(endpoints.jobId, jobs.id))
      .where(
        and(
          eq(endpoints.id, endpointId),
          eq(jobs.userId, userId),
        ),
      );

    if (endpointCheck.length === 0) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }
  }

  // Get usage stats
  const stats = await getUsageStats({
    endpointId,
    startDate,
    endDate,
  });

  return c.json(stats, HttpStatusCodes.OK);
};

/**
 * Get time-series usage data
 */
export const getTimeSeries: AppRouteHandler<GetTimeSeriesRoute> = async (c) => {
  // Get authenticated user
  const authUser = c.get("authUser");
  const userId = authUser!.user!.id;

  // Parse query parameters
  const { interval, endpointId, startDate, endDate } = c.req.valid("query");

  // If endpointId is provided, verify ownership
  if (endpointId) {
    const endpointCheck = await db
      .select()
      .from(endpoints)
      .innerJoin(jobs, eq(endpoints.jobId, jobs.id))
      .where(
        and(
          eq(endpoints.id, endpointId),
          eq(jobs.userId, userId),
        ),
      );

    if (endpointCheck.length === 0) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }
  }

  // Get time series data
  const timeSeries = await getUsageTimeSeries({
    interval,
    endpointId,
    startDate,
    endDate,
  });

  return c.json(timeSeries, HttpStatusCodes.OK);
};
