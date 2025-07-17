import { createUsersClient, createJobsClient } from "@cronicorn/api";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
console.log({ envVar: process.env.NEXT_PUBLIC_API_URL, baseUrl });

export const usersApiClient = createUsersClient(baseUrl);
export const jobsApiClient = createJobsClient(baseUrl);
