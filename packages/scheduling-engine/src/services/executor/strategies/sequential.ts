import type { EndpointExecutionResult, JobContext } from "../../../types.js";
import type { AIAgentPlanResponse } from "../../ai-agent/index.js";
import type { DefaultEndpointExecutorService } from "../endpoint-executor.js";

export async function executeSequentially(
    exec: DefaultEndpointExecutorService,
    jobContext: JobContext,
    plan: AIAgentPlanResponse,
    disabled?: Set<string>,
): Promise<EndpointExecutionResult[]> {
    const sorted = [...plan.endpointsToCall]
        .filter(ep => !disabled || !disabled.has(ep.endpointId))
        .sort((a, b) => a.priority - b.priority);
    const results: EndpointExecutionResult[] = [];
    for (const ep of sorted) {
        const r = await exec._executeSingle(jobContext, ep);
        results.push(r);
        if (ep.critical && !r.success)
            break;
    }
    return results;
}
