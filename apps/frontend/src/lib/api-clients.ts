import { createUsersClient, createJobsClient } from "@cronicorn/api";
import { getApiUrl } from "./get-api-url";

const baseUrl = getApiUrl();

export const usersApiClient = createUsersClient(baseUrl);
export const jobsApiClient = createJobsClient(baseUrl);
