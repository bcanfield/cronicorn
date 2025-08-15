/* eslint-disable ts/no-redeclare */

import { createRouter } from "@/api/lib/create-app.js";

import type { AppOpenAPI } from "../lib/types.js";

import { BASE_PATH } from "../lib/constants.js";
import apiKeys from "./api-keys/api-keys.index.js";
import contextEntries from "./context-entries/context-entries.index.js";
import endpointUsage from "./endpoint-usage/endpoint-usage.index.js";
import endpoints from "./endpoints/endpoints.index.js";
import jobs from "./jobs/jobs.index.js";
import messages from "./messages/messages.index.js";
import scheduler from "./scheduler/scheduler.index.js";

export function registerRoutes(app: AppOpenAPI) {
  return app
    .route("/", jobs)
    .route("/", endpoints)
    .route("/", messages)
    .route("/", contextEntries)
    .route("/", apiKeys)
    .route("/", endpointUsage)
    .route("/", scheduler);
}

// stand alone router type used for api client
export const router = registerRoutes(
  createRouter().basePath(BASE_PATH),
);
export type router = typeof router;
