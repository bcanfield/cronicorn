"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { JobsQuery } from "@cronicorn/rest-api";

export function useJobs(params: Partial<JobsQuery> = {}) {
	return useQuery({
		queryKey: ["jobs", params],
		queryFn: async () => {
			const response = await api.jobs.$get({
				query: params as any,
			});

			if (!response.ok) {
				throw new Error("Failed to fetch jobs");
			}

			return response.json();
		},
	});
}

export function useInfiniteJobs(params: Partial<JobsQuery> = {}) {
	return useInfiniteQuery({
		queryKey: ["jobs", "infinite", params],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await api.jobs.$get({
				query: { ...params, page: pageParam } as any,
			});

			if (!response.ok) {
				throw new Error("Failed to fetch jobs");
			}

			return response.json();
		},
		getNextPageParam: (lastPage) => {
			return lastPage.hasMore ? lastPage.page + 1 : undefined;
		},
		initialPageParam: 1,
	});
}

export function useJob(id: string) {
	return useQuery({
		queryKey: ["jobs", id],
		queryFn: async () => {
			const response = await api.jobs[":id"].$get({
				param: { id },
			});

			if (!response.ok) {
				throw new Error("Failed to fetch job");
			}

			return response.json();
		},
		enabled: !!id,
	});
}
