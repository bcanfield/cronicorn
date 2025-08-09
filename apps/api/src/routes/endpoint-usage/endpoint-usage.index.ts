import { createRouter } from "@/api/lib/create-app";

import * as handlers from "./endpoint-usage.handlers";
import * as routes from "./endpoint-usage.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.getStats, handlers.getStats)
  .openapi(routes.getTimeSeries, handlers.getTimeSeries);

export default router;
