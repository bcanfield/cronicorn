import { openai } from "@ai-sdk/openai";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AIAgentMetricsEvent } from "./types.js";

import { AIAgentConfigSchema } from "../../config.js";
import { cleanupAISDKMocks, enqueueGenerateObjectResults, setupAISDKMocks } from "../../tests/ai-agent-test-utils.js";
import { buildPlan } from "../../tests/builders.js";
import { planExecutionCore } from "./plan.js";

// Direct unit test for planExecutionCore focusing on semantic strict failure without repair

describe("planExecutionCore - repair failure", () => {
  beforeEach(() => {
    setupAISDKMocks();
  });

  afterEach(() => {
    cleanupAISDKMocks();
  });

  it("emits malformed when repair not enabled", async () => {
    const bad = buildPlan({ concurrencyLimit: 1 });
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
      planExecutionCore({
        jobContext: {
          job: {
            id: "p1",
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
        config,
        model: openai("test-model"),
        emit: (e: AIAgentMetricsEvent) => events.push(e),
      }),
    ).rejects.toThrow(/Semantic validation failed/);

    expect(events.some(e => e.type === "malformed" && e.phase === "plan")).toBeTruthy();
  });
});
