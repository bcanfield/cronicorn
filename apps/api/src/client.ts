/*
Define clients per model here just to let Typescript catch its breath
*/
import { hc } from "hono/client";
import { type AppType as UserAppType } from "./resolvers/user";
import { type AppType as JobsAppType } from "./resolvers/jobs";

export const createUsersClient = (baseUrl: string) => {
  return hc<UserAppType>(baseUrl + "/users");
};
export const createJobsClient = (baseUrl: string) => {
  return hc<JobsAppType>(baseUrl + "/jobs");
};
