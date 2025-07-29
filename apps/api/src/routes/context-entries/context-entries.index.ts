import { createRouter } from "@/api/lib/create-app";

import * as handlers from "./context-entries.handlers";
import * as routes from "./context-entries.routes";

const router = createRouter()
    .openapi(routes.list, handlers.list)
    .openapi(routes.create, handlers.create)
    .openapi(routes.getOne, handlers.getOne)
    .openapi(routes.patch, handlers.patch)
    .openapi(routes.remove, handlers.remove);

export default router;
