import PQueue from "p-queue";

import type { EndpointExecutionResult, JobContext } from "../../../types.js";
import type { AIAgentPlanResponse } from "../../ai-agent/index.js";
import type { DefaultEndpointExecutorService } from "../endpoint-executor.js";

export async function executeWithDependencies(
  exec: DefaultEndpointExecutorService,
  jobContext: JobContext,
  plan: AIAgentPlanResponse,
): Promise<EndpointExecutionResult[]> {
  const concurrencyLimit = plan.concurrencyLimit || exec.config.defaultConcurrencyLimit || 3;
  const queue = new PQueue({ concurrency: concurrencyLimit });
  const results: EndpointExecutionResult[] = [];
  const completed = new Set<string>();
  const failedCritical = new Set<string>();

  const areDepsMet = (ep: AIAgentPlanResponse["endpointsToCall"][0]): boolean => {
    if (!ep.dependsOn?.length)
      return true;
    if (ep.dependsOn.some(d => failedCritical.has(d)))
      return false;
    return ep.dependsOn.every(d => completed.has(d));
  };

  const executeAll = async (): Promise<void> => {
    const ready = plan.endpointsToCall.filter(e => !completed.has(e.endpointId)).filter(areDepsMet);
    if (ready.length === 0) {
      if (completed.size < plan.endpointsToCall.length) {
        const pending = plan.endpointsToCall.filter(e => !completed.has(e.endpointId)).map(e => e.endpointId);
        throw new Error(`Possible circular dependency detected for endpoints: ${pending.join(", ")}`);
      }
      return;
    }

    const batch: Promise<void>[] = [];
    for (const ep of ready) {
      const task = queue.add(async () => {
        const r = await exec._executeSingle(jobContext, ep);
        results.push(r);
        completed.add(ep.endpointId);
        if (ep.critical && !r.success)
          failedCritical.add(ep.endpointId);
      });
      batch.push(task);
    }
    await Promise.all(batch);
    if (completed.size < plan.endpointsToCall.length)
      await executeAll();
  };

  await executeAll();
  return results;
}
