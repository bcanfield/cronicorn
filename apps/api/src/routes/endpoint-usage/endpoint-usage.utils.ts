/**
 * Utility functions for tracking and managing endpoint usage metrics
 */

import { and, between, eq, sql } from "drizzle-orm";

import db from "@/api/db/index.js";
import { endpointUsage } from "@/api/db/schema/endpoint-usage.js";

/**
 * Record usage data for an endpoint execution
 *
 * @returns The inserted usage record
 */
export async function recordEndpointUsage({
  endpointId,
  requestSizeBytes = 0,
  responseSizeBytes = 0,
  executionTimeMs = 0,
  statusCode,
  success,
  truncated = false,
  errorMessage,
}: {
  endpointId: string;
  requestSizeBytes?: number;
  responseSizeBytes?: number;
  executionTimeMs?: number;
  statusCode?: number;
  success: boolean;
  truncated?: boolean;
  errorMessage?: string;
}): Promise<{ id: string } | null> {
  try {
    const [inserted] = await db.insert(endpointUsage)
      .values({
        endpointId,
        requestSizeBytes,
        responseSizeBytes,
        executionTimeMs,
        statusCode,
        // Convert boolean to integer (1/0)
        success: success ? 1 : 0,
        truncated: truncated ? 1 : 0,
        errorMessage,
      })
      .returning({ id: endpointUsage.id });

    return inserted;
  }
  catch (error) {
    console.error("Error recording endpoint usage:", error);
    return null;
  }
}

/**
 * Get usage statistics for an endpoint or all endpoints
 *
 * @returns Aggregated usage statistics
 */
export async function getUsageStats({
  endpointId,
  startDate,
  endDate,
}: {
  endpointId?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    // Build the WHERE conditions based on provided filters
    const conditions = [];

    if (endpointId) {
      conditions.push(eq(endpointUsage.endpointId, endpointId));
    }

    if (startDate && endDate) {
      conditions.push(between(endpointUsage.timestamp, startDate, endDate));
    }
    else if (startDate) {
      conditions.push(sql`${endpointUsage.timestamp} >= ${startDate}`);
    }
    else if (endDate) {
      conditions.push(sql`${endpointUsage.timestamp} <= ${endDate}`);
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Query for aggregated statistics
    const result = await db
      .select({
        totalExecutions: sql<number>`count(*)`,
        successCount: sql<number>`sum(case when ${endpointUsage.success} = 1 then 1 else 0 end)`,
        failureCount: sql<number>`sum(case when ${endpointUsage.success} = 0 then 1 else 0 end)`,
        avgRequestSizeBytes: sql<number>`avg(${endpointUsage.requestSizeBytes})`,
        avgResponseSizeBytes: sql<number>`avg(${endpointUsage.responseSizeBytes})`,
        avgExecutionTimeMs: sql<number>`avg(${endpointUsage.executionTimeMs})`,
        totalRequestSizeBytes: sql<number>`sum(${endpointUsage.requestSizeBytes})`,
        totalResponseSizeBytes: sql<number>`sum(${endpointUsage.responseSizeBytes})`,
        totalExecutionTimeMs: sql<number>`sum(${endpointUsage.executionTimeMs})`,
      })
      .from(endpointUsage)
      .where(whereCondition);

    // Format the result
    const stats = result[0] || {
      totalExecutions: 0,
      successCount: 0,
      failureCount: 0,
      avgRequestSizeBytes: 0,
      avgResponseSizeBytes: 0,
      avgExecutionTimeMs: 0,
      totalRequestSizeBytes: 0,
      totalResponseSizeBytes: 0,
      totalExecutionTimeMs: 0,
    };

    return {
      ...stats,
      // Ensure values are numbers (SQL might return strings or nulls)
      totalExecutions: Number(stats.totalExecutions) || 0,
      successCount: Number(stats.successCount) || 0,
      failureCount: Number(stats.failureCount) || 0,
      avgRequestSizeBytes: Math.round(Number(stats.avgRequestSizeBytes) || 0),
      avgResponseSizeBytes: Math.round(Number(stats.avgResponseSizeBytes) || 0),
      avgExecutionTimeMs: Math.round(Number(stats.avgExecutionTimeMs) || 0),
      totalRequestSizeBytes: Number(stats.totalRequestSizeBytes) || 0,
      totalResponseSizeBytes: Number(stats.totalResponseSizeBytes) || 0,
      totalExecutionTimeMs: Number(stats.totalExecutionTimeMs) || 0,
    };
  }
  catch (error) {
    console.error("Error getting usage statistics:", error);
    return {
      totalExecutions: 0,
      successCount: 0,
      failureCount: 0,
      avgRequestSizeBytes: 0,
      avgResponseSizeBytes: 0,
      avgExecutionTimeMs: 0,
      totalRequestSizeBytes: 0,
      totalResponseSizeBytes: 0,
      totalExecutionTimeMs: 0,
    };
  }
}

/**
 * Get time series data for endpoint usage
 *
 * @returns Array of time series data points
 */
export async function getUsageTimeSeries({
  interval = "day",
  endpointId,
  startDate,
  endDate,
}: {
  interval?: "day" | "week" | "month";
  endpointId?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    // Build the WHERE conditions based on provided filters
    const conditions = [];

    if (endpointId) {
      conditions.push(eq(endpointUsage.endpointId, endpointId));
    }

    if (startDate && endDate) {
      conditions.push(between(endpointUsage.timestamp, startDate, endDate));
    }
    else if (startDate) {
      conditions.push(sql`${endpointUsage.timestamp} >= ${startDate}`);
    }
    else if (endDate) {
      conditions.push(sql`${endpointUsage.timestamp} <= ${endDate}`);
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine the date format based on interval
    let dateFormat;
    switch (interval) {
      case "week":
        // Format as YYYY-WW (ISO week number)
        dateFormat = sql`to_char(${endpointUsage.timestamp}::date, 'IYYY-IW')`;
        break;
      case "month":
        // Format as YYYY-MM
        dateFormat = sql`to_char(${endpointUsage.timestamp}::date, 'YYYY-MM')`;
        break;
      case "day":
      default:
        // Format as YYYY-MM-DD
        dateFormat = sql`to_char(${endpointUsage.timestamp}::date, 'YYYY-MM-DD')`;
        break;
    }

    // Query for time series data
    const result = await db
      .select({
        period: dateFormat,
        count: sql<number>`count(*)`,
        successCount: sql<number>`sum(case when ${endpointUsage.success} = 1 then 1 else 0 end)`,
        failureCount: sql<number>`sum(case when ${endpointUsage.success} = 0 then 1 else 0 end)`,
        avgRequestSizeBytes: sql<number>`avg(${endpointUsage.requestSizeBytes})`,
        avgResponseSizeBytes: sql<number>`avg(${endpointUsage.responseSizeBytes})`,
        avgExecutionTimeMs: sql<number>`avg(${endpointUsage.executionTimeMs})`,
      })
      .from(endpointUsage)
      .where(whereCondition)
      .groupBy(dateFormat)
      .orderBy(dateFormat);

    // Format and return the results
    return result.map(item => ({
      period: String(item.period),
      count: Number(item.count) || 0,
      successCount: Number(item.successCount) || 0,
      failureCount: Number(item.failureCount) || 0,
      avgRequestSizeBytes: Math.round(Number(item.avgRequestSizeBytes) || 0),
      avgResponseSizeBytes: Math.round(Number(item.avgResponseSizeBytes) || 0),
      avgExecutionTimeMs: Math.round(Number(item.avgExecutionTimeMs) || 0),
    }));
  }
  catch (error) {
    console.error("Error getting usage time series:", error);
    return [];
  }
}
