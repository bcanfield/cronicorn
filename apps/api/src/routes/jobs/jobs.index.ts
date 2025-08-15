import { createRouter } from "@/api/lib/create-app.js";

import * as handlers from "./jobs.handlers.js";
import * as routes from "./jobs.routes.js";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.create)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.patch, handlers.patch)
  .openapi(routes.remove, handlers.remove);

export default router;
