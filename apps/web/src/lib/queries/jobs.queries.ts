import type { insertJobsSchema, patchJobsSchema } from "@tasks-app/api/schema";

import { queryOptions } from "@tanstack/react-query";

import apiClient from "../api-client";
import formatApiError from "../format-api-error";

export const queryKeys = {
    LIST_JOBS: { queryKey: ["list-jobs"] },
    LIST_JOB: (id: string) => ({ queryKey: [`list-job-${id}`] }),
};

export const jobsQueryOptions = queryOptions({
    ...queryKeys.LIST_JOBS,
    queryFn: async () => {
        const response = await apiClient.api.jobs.$get();
        return response.json();
    },
});

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
