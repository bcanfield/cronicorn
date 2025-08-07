/* eslint-disable ts/no-redeclare */

import { createRouter } from "@/api//lib/create-app";

import type { AppOpenAPI } from "../lib/types";

import { BASE_PATH } from "../lib/constants";
import apiKeys from "./api-keys/api-keys.index";
import contextEntries from "./context-entries/context-entries.index";
import endpointUsage from "./endpoint-usage/endpoint-usage.index";
import endpoints from "./endpoints/endpoints.index";
import jobs from "./jobs/jobs.index";
import messages from "./messages/messages.index";

export function registerRoutes(app: AppOpenAPI) {
  return app
    .route("/", jobs)
    .route("/", endpoints)
    .route("/", messages)
    .route("/", contextEntries)
    .route("/", apiKeys)
    .route("/", endpointUsage);
}

// stand alone router type used for api client
export const router = registerRoutes(
  createRouter().basePath(BASE_PATH),
);
export type router = typeof router;
