import type {
    listEndpointUsageSchema,
    timeSeriesOptionsSchema,
    usageStatsFilterSchema,
} from "@tasks-app/api/schema";

import { queryOptions } from "@tanstack/react-query";

import apiClient from "../api-client";

// Query keys for caching
export const queryKeys = {
    LIST_ENDPOINT_USAGE: (params: listEndpointUsageSchema) => ["list-endpoint-usage", params] as const,
    ENDPOINT_USAGE_STATS: (params: usageStatsFilterSchema) => ["endpoint-usage-stats", params] as const,
    ENDPOINT_USAGE_TIMESERIES: (params: timeSeriesOptionsSchema) => ["endpoint-usage-timeseries", params] as const,
};

// Query for listing endpoint usage with pagination and filters
export function endpointUsageQueryOptions(params: listEndpointUsageSchema) {
    return queryOptions({
        queryKey: queryKeys.LIST_ENDPOINT_USAGE(params),
        queryFn: async () => {
            const resp = await apiClient.api["endpoint-usage"].$get({ query: params });
            const json = await resp.json();
            if ("message" in json) {
                throw new Error(json.message);
            }
            return json;
        },
    });
}

// Query for endpoint usage statistics
export function endpointUsageStatsQueryOptions(params: usageStatsFilterSchema) {
    return queryOptions({
        queryKey: queryKeys.ENDPOINT_USAGE_STATS(params),
        queryFn: async () => {
            const resp = await apiClient.api["endpoint-usage"].stats.$get({ query: params });
            const json = await resp.json();
            if ("message" in json) {
                throw new Error(json.message);
            }
            return json;
        },
    });
}

// Query for endpoint usage time series
export function endpointUsageTimeSeriesQueryOptions(params: timeSeriesOptionsSchema) {
    return queryOptions({
        queryKey: queryKeys.ENDPOINT_USAGE_TIMESERIES(params),
        queryFn: async () => {
            const resp = await apiClient.api["endpoint-usage"]["time-series"].$get({ query: params });
            const json = await resp.json();
            if ("message" in json) {
                throw new Error(json.message);
            }
            return json;
        },
    });
}
