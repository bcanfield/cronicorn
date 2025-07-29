/* eslint-disable ts/no-redeclare */

import { createRouter } from "@/api//lib/create-app";

import type { AppOpenAPI } from "../lib/types";

import { BASE_PATH } from "../lib/constants";
import contextEntries from "./context-entries/context-entries.index";
import endpoints from "./endpoints/endpoints.index";
import index from "./index.route";
import jobs from "./jobs/jobs.index";
import messages from "./messages/messages.index";
import tasks from "./tasks/tasks.index";

export function registerRoutes(app: AppOpenAPI) {
  return app
    .route("/", index)
    .route("/", tasks)
    .route("/", jobs)
    .route("/", endpoints)
    .route("/", messages)
    .route("/", contextEntries);
}

// stand alone router type used for api client
export const router = registerRoutes(
  createRouter().basePath(BASE_PATH),
);
export type router = typeof router;
