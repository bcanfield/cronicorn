import type { EngineConfig } from "../config.js";
import type { AIAgentPlanResponse, AIAgentScheduleResponse, AIAgentService } from "../services/ai-agent/types.js";
import type { EngineState, ExecutionResults, JobContext } from "../types.js";

import { classifyPlanError, classifyScheduleError } from "../services/ai-agent/classification.js";

export type AIWrapperDeps = {
  aiAgent: AIAgentService;
  config: EngineConfig;
  state: EngineState;
};

export async function runPlanWithWrapper(deps: AIWrapperDeps, jobContext: JobContext): Promise<AIAgentPlanResponse> {
  try {
    return await deps.aiAgent.planExecution(jobContext);
  }
  catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const alreadyClassified = /Error in planExecution \[/.test(msg);
    const repairable = /Semantic validation failed|Error parsing|schema/i.test(msg) && !alreadyClassified;
    if (repairable && deps.config.aiAgent.repairMalformedResponses) {
      deps.state.stats.repairAttemptsPlan = (deps.state.stats.repairAttemptsPlan ?? 0) + 1;
      try {
        const repaired = await deps.aiAgent.planExecution(jobContext);
        deps.state.stats.repairSuccessesPlan = (deps.state.stats.repairSuccessesPlan ?? 0) + 1;
        return repaired;
      }
      catch (err2) {
        deps.state.stats.repairFailuresPlan = (deps.state.stats.repairFailuresPlan ?? 0) + 1;
        deps.state.stats.malformedResponsesPlan = (deps.state.stats.malformedResponsesPlan ?? 0) + 1;
        throw err2;
      }
    }
    classifyPlanError(msg);
    deps.state.stats.malformedResponsesPlan = (deps.state.stats.malformedResponsesPlan ?? 0) + 1;
    throw err;
  }
}

export async function runScheduleWithWrapper(deps: AIWrapperDeps, jobContext: JobContext, executionResults: ExecutionResults): Promise<AIAgentScheduleResponse> {
  try {
    return await deps.aiAgent.finalizeSchedule(jobContext, executionResults);
  }
  catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const alreadyClassified = /Error in finalizeSchedule \[/.test(msg);
    const repairable = /Semantic validation failed|Error parsing|schema/i.test(msg) && !alreadyClassified;
    if (repairable && deps.config.aiAgent.repairMalformedResponses) {
      deps.state.stats.repairAttemptsSchedule = (deps.state.stats.repairAttemptsSchedule ?? 0) + 1;
      try {
        const repaired = await deps.aiAgent.finalizeSchedule(jobContext, executionResults);
        deps.state.stats.repairSuccessesSchedule = (deps.state.stats.repairSuccessesSchedule ?? 0) + 1;
        return repaired;
      }
      catch (err2) {
        deps.state.stats.repairFailuresSchedule = (deps.state.stats.repairFailuresSchedule ?? 0) + 1;
        deps.state.stats.malformedResponsesSchedule = (deps.state.stats.malformedResponsesSchedule ?? 0) + 1;
        throw err2;
      }
    }
    classifyScheduleError(msg);
    deps.state.stats.malformedResponsesSchedule = (deps.state.stats.malformedResponsesSchedule ?? 0) + 1;
    throw err;
  }
}
