import { cors } from "hono/cors";

import configureOpenAPI from "@/api/lib/configure-open-api.js";
import createApp from "@/api/lib/create-app.js";
import apiKeys from "@/api/routes/api-keys/api-keys.index.js";
import endpointUsage from "@/api/routes/endpoint-usage/endpoint-usage.index.js";
import endpoints from "@/api/routes/endpoints/endpoints.index.js";
import jobs from "@/api/routes/jobs/jobs.index.js";
import messages from "@/api/routes/messages/messages.index.js";
import scheduler from "@/api/routes/scheduler/scheduler.index.js";

const app = createApp();

// Add CORS middleware to allow requests from any origin
// This is important for API accessibility from various clients
app.use("*", cors({
  // Allow requests from any origin (or specify specific origins in an array)
  origin: "*",
  // Allow these HTTP methods
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  // Allow these headers in requests
  allowHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-API-Secret", "X-Requested-With"],
  // Expose these response headers to the browser
  exposeHeaders: ["Content-Length", "X-Request-Id"],
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  // How long the preflight request can be cached (in seconds)
  maxAge: 600,
}));

configureOpenAPI(app);

const routes = [
  jobs,
  apiKeys,
  messages,
  endpoints,
  endpointUsage,
  scheduler,
] as const;

routes.forEach((route) => {
  app.route("/", route);
});

export type AppType = typeof routes[number];

export default app;
