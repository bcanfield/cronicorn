/*
Define clients per model here just to let Typescript catch its breath
*/
import { hc } from "hono/client";
import { type AppType as UserAppType } from "./resolvers/user";
import { type AppType as JobsAppType } from "./resolvers/jobs";
import { type AppType as CronicornAppType } from "./resolvers/cronicorn";
import { type AppType as MessagesAppType } from "./resolvers/messages";

export const createUsersClient = (baseUrl: string) => {
  return hc<UserAppType>(baseUrl + "/users");
};
export const createJobsClient = (baseUrl: string) => {
  return hc<JobsAppType>(baseUrl + "/jobs");
};

export const createCronicornClient = (baseUrl: string) => {
  return hc<CronicornAppType>(baseUrl + "/cronicorn");
};
export const createMessagesClient = (baseUrl: string) => {
  return hc<MessagesAppType>(baseUrl + "/messages");
};
