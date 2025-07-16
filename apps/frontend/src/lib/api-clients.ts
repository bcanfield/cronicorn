import {
  createUsersClient,
  createJobsClient,
  createCronicornClient,
} from "@cronicorn/api";

const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api`;

export const usersApiClient = createUsersClient(baseUrl);
export const jobsApiClient = createJobsClient(baseUrl);
export const cronicornApiClient = createCronicornClient(baseUrl);
