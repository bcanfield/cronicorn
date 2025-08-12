import { createRouter } from "@/api/lib/create-app";

import * as handlers from "./scheduler.handlers";
import * as routes from "./scheduler.routes";

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
  .openapi(routes.getEngineMetrics, handlers.getEngineMetrics);

export default router;
