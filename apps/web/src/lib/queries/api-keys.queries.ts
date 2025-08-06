import type { insertApiKeysSchema, listApiKeysSchema, patchApiKeysSchema } from "@tasks-app/api/schema";

import { queryOptions } from "@tanstack/react-query";

import apiClient from "../api-client";
import formatApiError from "../format-api-error";

export const queryKeys = {
  LIST_API_KEYS: () => ["list-api-keys"] as const,
  LIST_API_KEY: (id: string) => ({ queryKey: [`list-api-key-${id}`] }),
};

/**
 * React-Query options for listing API keys with dynamic query params
 */
export function apiKeysQueryOptions(params: listApiKeysSchema) {
  // ⬇️ build a stable tuple key
  const key = [...queryKeys.LIST_API_KEYS(), params] as const;

  return queryOptions({
    queryKey: key,
    // React-Query will pass { queryKey } into your fn
    queryFn: async ({ queryKey: [, q] }) => {
      const resp = await apiClient.api["api-keys"].$get({ query: q });
      const json = await resp.json();
      if ("message" in json) {
        throw new Error(json.message);
      }
      return json;
    },
  });
}

export const createApiKeyQueryOptions = (id: string) =>
  queryOptions({
    ...queryKeys.LIST_API_KEY(id),
    queryFn: async () => {
      const response = await apiClient.api["api-keys"][":id"].$get({ param: { id } });
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

export const createApiKey = async (apiKey: insertApiKeysSchema) => {
  const response = await apiClient.api["api-keys"].$post({ json: apiKey });
  const json = await response.json();
  if ("success" in json) {
    throw new Error(formatApiError(json));
  }
  if ("message" in json) {
    throw new Error(json.message);
  }
  return json;
};

export const deleteApiKey = async (id: string) => {
  const response = await apiClient.api["api-keys"][":id"].$delete({ param: { id } });
  if (response.status !== 200) {
    const json = await response.json();
    if ("message" in json) {
      throw new Error(json.message);
    }
    throw new Error(formatApiError(json));
  }
};

export const updateApiKey = async ({ id, apiKey }: { id: string; apiKey: patchApiKeysSchema }) => {
  const response = await apiClient.api["api-keys"][":id"].$patch({ param: { id }, json: apiKey });
  if (response.status !== 200) {
    const json = await response.json();
    if ("message" in json) {
      throw new Error(json.message);
    }
    throw new Error(formatApiError(json));
  }
  const json = await response.json();
  return json;
};
