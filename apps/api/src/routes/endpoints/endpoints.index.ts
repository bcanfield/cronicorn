import { createRouter } from "@/api/lib/create-app.js";

import * as handlers from "./endpoints.handlers.js";
import * as routes from "./endpoints.routes.js";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.create)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.patch, handlers.patch)
  .openapi(routes.remove, handlers.remove)
  .openapi(routes.run, handlers.run);

export default router;
