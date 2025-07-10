"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { MessagesQuery } from "@cronicorn/rest-api";

export function useMessages(params: Partial<MessagesQuery> = {}) {
	return useQuery({
		queryKey: ["messages", params],
		queryFn: async () => {
			const response = await api.messages.$get({
				query: params as any,
			});

			if (!response.ok) {
				throw new Error("Failed to fetch messages");
			}

			return response.json();
		},
	});
}

export function useJobMessages(jobId: string, params: Partial<MessagesQuery> = {}) {
	return useQuery({
		queryKey: ["jobs", jobId, "messages", params],
		queryFn: async () => {
			const response = await api.jobs[":id"].messages.$get({
				param: { id: jobId },
				query: params as any,
			});

			if (!response.ok) {
				throw new Error("Failed to fetch job messages");
			}

			return response.json();
		},
		enabled: !!jobId,
	});
}

export function useInfiniteMessages(params: Partial<MessagesQuery> = {}) {
	return useInfiniteQuery({
		queryKey: ["messages", "infinite", params],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await api.messages.$get({
				query: { ...params, page: pageParam } as any,
			});

			if (!response.ok) {
				throw new Error("Failed to fetch messages");
			}

			return response.json();
		},
		getNextPageParam: (lastPage) => {
			return lastPage.hasMore ? lastPage.page + 1 : undefined;
		},
		initialPageParam: 1,
	});
}
