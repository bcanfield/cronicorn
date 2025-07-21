import type { insertTasksSchema, patchTasksSchema } from "@tasks-app/api/schema";

import { queryOptions } from "@tanstack/react-query";

import apiClient from "./api-client";
import formatApiError from "./format-api-error";

export const queryKeys = {
  LIST_TASKS: { queryKey: ["list-tasks"] },
  LIST_TASK: (id: string) => ({ queryKey: [`list-task-${id}`] }),
};

export const tasksQueryOptions = queryOptions({
  ...queryKeys.LIST_TASKS,
  queryFn: async () => {
    const response = await apiClient.api.tasks.$get();
    return response.json();
  },
});

export const createTaskQueryOptions = (id: string) => queryOptions({
  ...queryKeys.LIST_TASK(id),
  queryFn: async () => {
    const response = await apiClient.api.tasks[":id"].$get({
      param: {
        // @ts-expect-error allow strings for error messages
        id,
      },
    });
    const json = await response.json();
    if ("message" in json) {
      throw new Error(json.message);
    }
    if ("success" in json) {
      const message = formatApiError(json);
      throw new Error(message);
    }
    return json;
  },
});

export const createTask = async (task: insertTasksSchema) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const response = await apiClient.api.tasks.$post({
    json: task,
  });
  const json = await response.json();
  if ("success" in json) {
    const message = formatApiError(json);
    throw new Error(message);
  }
  return json;
};

export const deleteTask = async (id: string) => {
  const response = await apiClient.api.tasks[":id"].$delete({
    param: {
      // @ts-expect-error allow to show server error
      id,
    },
  });
  if (response.status !== 204) {
    const json = await response.json();
    if ("message" in json) {
      throw new Error(json.message);
    }
    const message = formatApiError(json);
    throw new Error(message);
  }
};

export const updateTask = async ({ id, task }: { id: string; task: patchTasksSchema }) => {
  const response = await apiClient.api.tasks[":id"].$patch({
    param: {
      // @ts-expect-error allow to show server error
      id,
    },
    json: task,
  });
  if (response.status !== 200) {
    const json = await response.json();
    if ("message" in json) {
      throw new Error(json.message);
    }
    const message = formatApiError(json);
    throw new Error(message);
  }
};
