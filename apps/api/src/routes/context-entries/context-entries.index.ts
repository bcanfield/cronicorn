import { createRouter } from "@/api/lib/create-app.js";

import * as handlers from "./context-entries.handlers.js";
import * as routes from "./context-entries.routes.js";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.create)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.patch, handlers.patch)
  .openapi(routes.remove, handlers.remove);

export default router;
