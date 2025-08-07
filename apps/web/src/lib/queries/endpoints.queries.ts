import type { insertEndpointsSchema, listEndpointsSchema, patchEndpointsSchema } from "@tasks-app/api/schema";

import { queryOptions } from "@tanstack/react-query";

import apiClient from "../api-client";
import formatApiError from "../format-api-error";

export const queryKeys = {
  LIST_ENDPOINTS: (jobId: string) => ["list-endpoints", jobId] as const,
  LIST_ENDPOINT: (endpointId: string) => ({ queryKey: [`list-endpoint-${endpointId}`] }),
};

/**
 * React-Query options for listing endpoints with dynamic query params
 */
export function endpointsQueryOptions(params: listEndpointsSchema, jobId: string) {
  // ⬇️ build a stable tuple key
  const key = [...queryKeys.LIST_ENDPOINTS(jobId), params] as const;

  return queryOptions({
    queryKey: key,
    // React-Query will pass { queryKey } into your fn
    queryFn: async ({ queryKey: [_, jobId, params] }) => {
      // If we have a jobId, use it to filter endpoints
      const modifiedQuery = jobId ? { ...params, jobId } : params;
      const resp = await apiClient.api.endpoints.$get({ query: modifiedQuery });
      const json = await resp.json();
      if ("message" in json) {
        throw new Error(json.message);
      }
      return json;
    },
  });
}

export const createEndpointQueryOptions = (endpointId: string) =>
  queryOptions({
    ...queryKeys.LIST_ENDPOINT(endpointId),
    queryFn: async () => {
      const response = await apiClient.api.endpoints[":id"].$get({ param: { id: endpointId } });
      const json = await response.json();
      if ("message" in json) {
        throw new Error(json.message);
      }
      if ("success" in json) {
        throw new Error(formatApiError(json));
      }
      return json;
    },
  });

export const createEndpoint = async (endpoint: insertEndpointsSchema) => {
  const response = await apiClient.api.endpoints.$post({ json: endpoint });
  const json = await response.json();
  if ("message" in json) {
    throw new Error(json.message);
  }
  if ("success" in json) {
    throw new Error(formatApiError(json));
  }
  return json;
};

export const updateEndpoint = async ({ id, endpoint }: { id: string; endpoint: patchEndpointsSchema }) => {
  const response = await apiClient.api.endpoints[":id"].$patch({
    param: { id },
    json: endpoint,
  });
  const json = await response.json();
  if ("message" in json) {
    throw new Error(json.message);
  }
  if ("success" in json) {
    throw new Error(formatApiError(json));
  }
  return json;
};

export const deleteEndpoint = async (id: string) => {
  const response = await apiClient.api.endpoints[":id"].$delete({
    param: { id },
  });
  if (response.status !== 204) {
    const json = await response.json();
    // Handle potential error responses
    if (typeof json === "object" && json !== null) {
      if ("message" in json && typeof json.message === "string") {
        throw new Error(json.message);
      }
      if ("success" in json && json.success === false) {
        throw new Error("Failed to delete endpoint");
      }
    }
  }
};

export const runEndpoint = async ({ id, requestBody }: { id: string; requestBody?: unknown }) => {
  const response = await apiClient.api.endpoints[":id"].run.$post({
    param: { id },
    json: { requestBody },
  });
  const json = await response.json();

  // We don't throw error for non-success response from the target endpoint
  // as that's part of the expected response data
  if ("message" in json && response.status >= 400) {
    throw new Error(json.message);
  }

  return json;
};
