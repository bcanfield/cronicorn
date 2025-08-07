import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createErrorSchema } from "stoker/openapi/schemas";

import {
    listEndpointUsageSchema,
    selectEndpointUsageSchema,
    timeSeriesOptionsSchema,
    timeSeriesSchema,
    usageStatsFilterSchema,
    usageStatsSchema,
} from "@/api/db/schema/endpoint-usage";
import { notFoundSchema } from "@/api/lib/constants";

const tags = ["Endpoint Usage"];

// Route for listing endpoint usage records
export const list = createRoute({
    path: "/endpoint-usage",
    method: "get",
    tags,
    summary: "List Endpoint Usage Records",
    description: "Retrieve a paginated list of endpoint usage records with optional filtering by endpoint, date range, or success status.",
    request: { query: listEndpointUsageSchema },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.object({
                items: z.array(selectEndpointUsageSchema.extend({
                    endpoint: z.object({
                        name: z.string(),
                        url: z.string(),
                        method: z.string(),
                    }),
                })),
                hasNext: z.boolean(),
            }),
            "The paginated list of endpoint usage records",
        ),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
            notFoundSchema,
            "Authentication required",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(listEndpointUsageSchema),
            "Validation error(s)",
        ),
    },
});

// Route for getting usage statistics
export const getStats = createRoute({
    path: "/endpoint-usage/stats",
    method: "get",
    tags,
    summary: "Get Usage Statistics",
    description: "Retrieve aggregated usage statistics for endpoints, including request and response sizes, execution times, and success/failure counts.",
    request: { query: usageStatsFilterSchema },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            usageStatsSchema,
            "The usage statistics",
        ),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
            notFoundSchema,
            "Authentication required",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(usageStatsFilterSchema),
            "Validation error(s)",
        ),
    },
});

// Route for getting time series data
export const getTimeSeries = createRoute({
    path: "/endpoint-usage/time-series",
    method: "get",
    tags,
    summary: "Get Time Series Data",
    description: "Retrieve time series data for endpoint usage, aggregated by day, week, or month.",
    request: { query: timeSeriesOptionsSchema },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.array(timeSeriesSchema),
            "The time series data",
        ),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
            notFoundSchema,
            "Authentication required",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(timeSeriesOptionsSchema),
            "Validation error(s)",
        ),
    },
});

export type ListRoute = typeof list;
export type GetStatsRoute = typeof getStats;
export type GetTimeSeriesRoute = typeof getTimeSeries;
