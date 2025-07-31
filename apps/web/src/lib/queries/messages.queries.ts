import type { insertMessagesSchema, listMessagesByJobIdSchema, listMessagesSchema } from "@tasks-app/api/schema";

import { queryOptions } from "@tanstack/react-query";

import apiClient from "../api-client";
import formatApiError from "../format-api-error";

export const queryKeys = {
    LIST_MESSAGES: () => ["list-messages"] as const,
    LIST_MESSAGE: (id: string) => ({ queryKey: [`list-message-${id}`] }),
};

/**
 * React-Query options for listing messages with dynamic query params
 */
export function messagesQueryOptions(params: listMessagesSchema | listMessagesByJobIdSchema) {
    // ⬇️ build a stable tuple key
    const key = [...queryKeys.LIST_MESSAGES(), params] as const;

    return queryOptions({
        queryKey: key,
        queryFn: async ({ queryKey: [, q] }) => {
            const resp = await apiClient.api.messages.$get({ query: q });
            return resp.json();
        },
    });
}

/**
 * React-Query options for getting a single message by ID
 */
export const createMessageQueryOptions = (id: string) =>
    queryOptions({
        ...queryKeys.LIST_MESSAGE(id),
        queryFn: async () => {
            const response = await apiClient.api.messages[":id"].$get({ param: { id } });
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

/**
 * Delete a message
 */
export const deleteMessage = async (id: string) => {
    const response = await apiClient.api.messages[":id"].$delete({
        param: { id },
    });
    const json = await response.json();

    // Handle potential error responses
    if (typeof json === "object" && json !== null) {
        if ("message" in json && typeof json.message === "string") {
            throw new Error(json.message);
        }
        if ("success" in json && json.success === false) {
            throw new Error("Failed to delete message");
        }
    }

    return json;
};

/**
 * Create a new message
 */
export const createMessage = async (message: insertMessagesSchema) => {
    const response = await apiClient.api.messages.$post({ json: message });
    const json = await response.json();
    if ("success" in json) {
        throw new Error(formatApiError(json));
    }
    return json;
};
