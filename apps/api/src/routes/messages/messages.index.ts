import { createRouter } from "@/api/lib/create-app";

import * as handlers from "./messages.handlers";
import * as routes from "./messages.routes";

const router = createRouter()
    .openapi(routes.list, handlers.list)
    .openapi(routes.create, handlers.create)
    .openapi(routes.getOne, handlers.getOne)
    .openapi(routes.patch, handlers.patch)
    .openapi(routes.remove, handlers.remove);

export default router;
