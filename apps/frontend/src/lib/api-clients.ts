import { createUsersClient, createJobsClient } from "@cronicorn/api";

const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}`;

export const usersApiClient = createUsersClient(baseUrl);
export const jobsApiClient = createJobsClient(baseUrl);
