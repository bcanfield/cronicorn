import { createRouter } from "@/api/lib/create-app.js";

import * as handlers from "./scheduler.handlers.js";
import * as routes from "./scheduler.routes.js";

const router = createRouter()
  .openapi(routes.getJobsToProcess, handlers.getJobsToProcess)
  .openapi(routes.lockJob, handlers.lockJob)
  .openapi(routes.unlockJob, handlers.unlockJob)
  .openapi(routes.getJobContext, handlers.getJobContext)
  .openapi(routes.recordExecutionPlan, handlers.recordExecutionPlan)
  .openapi(routes.recordEndpointResults, handlers.recordEndpointResults)
  .openapi(routes.recordExecutionSummary, handlers.recordExecutionSummary)
  .openapi(routes.updateJobSchedule, handlers.updateJobSchedule)
  .openapi(routes.recordJobError, handlers.recordJobError)
  .openapi(routes.getEngineMetrics, handlers.getEngineMetrics)
  .openapi(routes.updateExecutionStatus, handlers.updateExecutionStatus);

export default router;
