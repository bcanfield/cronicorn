import type { insertEndpointsSchema, listEndpointsSchema, patchEndpointsSchema } from "@tasks-app/api/schema";

import { queryOptions } from "@tanstack/react-query";

import apiClient from "../api-client";
import formatApiError from "../format-api-error";

export const queryKeys = {
  LIST_ENDPOINTS: () => ["list-endpoints"] as const,
  LIST_ENDPOINT: (id: string) => ({ queryKey: [`list-endpoint-${id}`] }),
};

/**
 * React-Query options for listing endpoints with dynamic query params
 */
export function endpointsQueryOptions(params: listEndpointsSchema, jobId?: string) {
  // ⬇️ build a stable tuple key
  const key = [...queryKeys.LIST_ENDPOINTS(), params, jobId] as const;

  return queryOptions({
    queryKey: key,
    // React-Query will pass { queryKey } into your fn
    queryFn: async ({ queryKey: [, q, currentJobId] }) => {
      // If we have a jobId, use it to filter endpoints
      const modifiedQuery = currentJobId ? { ...q, jobId: currentJobId } : q;
      const resp = await apiClient.api.endpoints.$get({ query: modifiedQuery });
      const json = await resp.json();
      if ("message" in json) {
        throw new Error(json.message);
      }
      return json;
    },
  });
}

export const createEndpointQueryOptions = (id: string) =>
  queryOptions({
    ...queryKeys.LIST_ENDPOINT(id),
    queryFn: async () => {
      const response = await apiClient.api.endpoints[":id"].$get({ param: { id } });
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
