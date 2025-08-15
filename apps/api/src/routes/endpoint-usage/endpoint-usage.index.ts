import { createRouter } from "@/api/lib/create-app.js";

import * as handlers from "./endpoint-usage.handlers.js";
import * as routes from "./endpoint-usage.routes.js";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.getStats, handlers.getStats)
  .openapi(routes.getTimeSeries, handlers.getTimeSeries);

export default router;
