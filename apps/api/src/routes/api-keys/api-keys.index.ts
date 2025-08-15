import { createRouter } from "@/api/lib/create-app.js";

import * as handlers from "./api-keys.handlers.js";
import * as routes from "./api-keys.routes.js";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.create)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.patch, handlers.patch)
  .openapi(routes.revoke, handlers.revoke)
  .openapi(routes.remove, handlers.remove);

export default router;
