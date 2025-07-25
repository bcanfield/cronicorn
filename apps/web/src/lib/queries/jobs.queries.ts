import type { insertJobsSchema, ListJobsQuery, patchJobsSchema } from "@tasks-app/api/schema";

import { queryOptions } from "@tanstack/react-query";

import apiClient from "../api-client";
import formatApiError from "../format-api-error";

export const queryKeys = {
  LIST_JOBS: () => ["list-jobs"] as const,
  LIST_JOB: (id: string) => ({ queryKey: [`list-job-${id}`] }),
};

/**
 * React-Query options for listing jobs with dynamic query params
 */
export function jobsQueryOptions(params: ListJobsQuery) {
  // ⬇️ build a stable tuple key
  const key = [...queryKeys.LIST_JOBS(), params] as const;

  return queryOptions({
    queryKey: key,
    // React-Query will pass { queryKey } into your fn
    queryFn: async ({ queryKey: [, q] }) => {
      const resp = await apiClient.api.jobs.$get({ query: q });
      return resp.json();
    },

    // // optional: don’t refetch for 60s if you re-mount
    // staleTime: 1000 * 60,
  });
}
export const createJobQueryOptions = (id: string) =>
  queryOptions({
    ...queryKeys.LIST_JOB(id),
    queryFn: async () => {
      const response = await apiClient.api.jobs[":id"].$get({ param: { id } });
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

export const createJob = async (job: insertJobsSchema) => {
  const response = await apiClient.api.jobs.$post({ json: job });
  const json = await response.json();
  if ("success" in json) {
    throw new Error(formatApiError(json));
  }
  return json;
};

export const deleteJob = async (id: string) => {
  const response = await apiClient.api.jobs[":id"].$delete({ param: { id } });
  if (response.status !== 204) {
    const json = await response.json();
    if ("message" in json) {
      throw new Error(json.message);
    }
    throw new Error(formatApiError(json));
  }
};

export const updateJob = async ({ id, job }: { id: string; job: patchJobsSchema }) => {
  const response = await apiClient.api.jobs[":id"].$patch({ param: { id }, json: job });
  if (response.status !== 200) {
    const json = await response.json();
    if ("message" in json) {
      throw new Error(json.message);
    }
    throw new Error(formatApiError(json));
  }
};
