import configureOpenAPI from "@/api/lib/configure-open-api";
import createApp from "@/api/lib/create-app";
import apiKeys from "@/api/routes/api-keys/api-keys.index";
import endpointUsage from "@/api/routes/endpoint-usage/endpoint-usage.index";
import endpoints from "@/api/routes/endpoints/endpoints.index";
import jobs from "@/api/routes/jobs/jobs.index";
import messages from "@/api/routes/messages/messages.index";

const app = createApp();

configureOpenAPI(app);

const routes = [
  jobs,
  apiKeys,
  messages,
  endpoints,
  endpointUsage,
] as const;

routes.forEach((route) => {
  app.route("/", route);
});

export type AppType = typeof routes[number];

export default app;
