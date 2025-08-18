import PQueue from "p-queue";

import type { EndpointExecutionResult, JobContext } from "../../../types.js";
import type { AIAgentPlanResponse } from "../../ai-agent/index.js";
import type { DefaultEndpointExecutorService } from "../endpoint-executor.js";

export async function executeInParallel(
  exec: DefaultEndpointExecutorService,
  jobContext: JobContext,
  plan: AIAgentPlanResponse,
): Promise<EndpointExecutionResult[]> {
  const concurrencyLimit = plan.concurrencyLimit || exec.config.defaultConcurrencyLimit || 3;
  const queue = new PQueue({ concurrency: concurrencyLimit });
  const results: EndpointExecutionResult[] = [];
  const tasks = plan.endpointsToCall.map(ep => queue.add(async () => {
    const r = await exec._executeSingle(jobContext, ep);
    results.push(r);
  }));
  await Promise.all(tasks);
  return results;
}
