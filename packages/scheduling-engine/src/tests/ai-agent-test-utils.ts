import { vi } from "vitest";

export type TokenUsage = { inputTokens: number; outputTokens: number; totalTokens: number };
export type QueuedGenerateObjectResult = {
  object: unknown;
  text: string;
  usage: TokenUsage;
  finishReason: string;
  warnings?: unknown[];
};

const generateQueue: QueuedGenerateObjectResult[] = [];

function dequeue(): QueuedGenerateObjectResult {
  if (!generateQueue.length) {
    throw new Error("No queued generateObject result – enqueue with enqueueGenerateObjectResults()");
  }
  return generateQueue.shift()!; // shift guaranteed by length check
}

export function enqueueGenerateObjectResults(...results: QueuedGenerateObjectResult[]) {
  for (const r of results) generateQueue.push(r);
}

export function queuedResponsesCount() {
  return generateQueue.length;
}

export function setupAISDKMocks() {
  vi.mock("ai", async () => {
    const actual = await vi.importActual("ai");
    return {
      ...actual,
      generateObject: vi.fn().mockImplementation(() => Promise.resolve(dequeue())),
      generateText: vi.fn().mockImplementation(() => Promise.resolve({ text: "mock text", usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, finishReason: "stop" })),
    };
  });
  vi.mock("@ai-sdk/openai", () => ({ openai: vi.fn().mockReturnValue({}) }));
}

export function cleanupAISDKMocks() {
  vi.clearAllMocks();
  generateQueue.length = 0;
}
