import { openai } from "@ai-sdk/openai";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AIAgentMetricsEvent } from "./types.js";

import { AIAgentConfigSchema } from "../../config.js";
import { cleanupAISDKMocks, enqueueGenerateObjectResults, setupAISDKMocks } from "../../tests/ai-agent-test-utils.js";
import { buildSchedule } from "../../tests/builders.js";
import { scheduleExecutionCore } from "./schedule.js";

// Direct unit test for scheduleExecutionCore focusing on semantic strict failure without repair

describe("scheduleExecutionCore - repair failure", () => {
  beforeEach(() => {
    setupAISDKMocks();
  });

  afterEach(() => {
    cleanupAISDKMocks();
  });

  it("emits malformed when repair not enabled", async () => {
    const past = new Date(Date.now() - 60000).toISOString();
    const bad = buildSchedule({ nextRunAt: past });
    enqueueGenerateObjectResults({
      object: bad,
      text: JSON.stringify(bad),
      usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      finishReason: "stop",
    });

    const config = AIAgentConfigSchema.parse({
      model: "test-model",
      validateSemantics: true,
      semanticStrict: true,
      repairMalformedResponses: false,
    });

    const events: AIAgentMetricsEvent[] = [];

    await expect(
      scheduleExecutionCore({
        jobContext: {
          job: {
            id: "s1",
            definitionNL: "d",
            status: "ACTIVE",
            locked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          endpoints: [],
          messages: [],
          endpointUsage: [],
        },
        executionResults: {
          results: [],
          summary: {
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            totalDurationMs: 0,
            successCount: 0,
            failureCount: 0,
          },
        },
        config,
        model: openai("test-model"),
        emit: (e: AIAgentMetricsEvent) => events.push(e),
      }),
    ).rejects.toThrow(/Semantic validation failed/);

    expect(events.some(e => e.type === "malformed" && e.phase === "schedule")).toBeTruthy();
  });
});
