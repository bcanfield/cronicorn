import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  generateText,
  hasToolCall,
  jsonSchema,
  type JSONSchema7,
  type ModelMessage,
  type Tool,
  tool,
  type UIMessage,
} from "ai";

import { z } from "zod";

import type { JSONSchemaType } from "ajv";
import { ajvInstance } from "./ajv";
import { buildSystemPrompt } from "./build-system-prompt";
import {
  createSaaSApiClient,
  type SaaSApiClient,
  type ValidatedEndpoint,
} from "./types";
import { validateJson } from "./validate-json";
import { sanitizeToolName } from "./sanitaze-tool-name";
import {
  getJobById,
  getJobMessages,
  getJobWithEndpoints,
  getMessages,
} from "@cronicorn/database";

/**
 * Entry point: runs the scheduler agent for a given job ID.
 */
export async function runAgentForJob({
  jobId,
  messages,
}: {
  jobId: string;
  messages: UIMessage[];
}) {
  console.log(`🔍 Running agent for job ${jobId}...`);

  // 1) Load job config from DB (includes NL logic and endpoint schemas)

  const job = await getJobWithEndpoints(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  // 2) Initialize SaaS API client
  const client: SaaSApiClient = createSaaSApiClient();
  // persist the trigger message first to ensure it appears in correct order
  await client.appendJobHistory(jobId, convertToModelMessages(messages));
  // 3) Fetch history and context for testing or live
  // const history = testHistory; // use testHistory or: await client.getJobHistory(jobId)

  // TODO: use zod to parse this
  const history = (await getJobMessages(jobId)) as ModelMessage[];
  // 4) Build system prompt with core + user tools
  const prompt = buildSystemPrompt(job.definitionNL, job.endpoints);
  console.log({ prompt });

  // 5) Prepare validated endpoints
  // const validatedEndpoints: ValidatedEndpoint[] = job.endpoints.map((ep) => {
  //   const req = ep.requestSchema as JSONSchema7;
  //   if (req) {
  //     ajvInstance.compile(req as JSONSchemaType<unknown>);
  //   }
  //   return { ...ep, requestSchema: req };
  // });

  // 6) Define tools dynamically
  // const tools = defineTools(validatedEndpoints, client, jobId);
  const tools = getCoreTools(client, jobId);

  const result = await generateText({
    model: openai("gpt-4o"),
    system: prompt,
    messages: history,
    tools,
    stopWhen: hasToolCall("scheduleNext"),
  });

  // 8) Persist new messages
  await client.appendJobHistory(jobId, result.response.messages, result.usage);

  console.log("✅ Run complete.");
}

/**
 * Separates definitions of core scheduler tools and user webhook tools.
 */
function defineTools(
  endpoints: ValidatedEndpoint[],
  client: SaaSApiClient,
  jobId: string
): Record<string, Tool> {
  const tools: Record<string, Tool> = {};

  // Core scheduling primitives
  const coreTools = getCoreTools(client, jobId);
  Object.assign(tools, coreTools);

  // User-defined webhook tools
  endpoints.forEach((ep) => {
    tools[sanitizeToolName(ep.name)] = tool({
      description: `Webhook call: ${ep.url}`,
      inputSchema: ep.requestSchema
        ? jsonSchema(ep.requestSchema)
        : z.object({}),
      outputSchema: jsonSchema<unknown>({}),

      execute: async (input) => {
        if (ep.requestSchema) validateJson(ep.requestSchema, input);

        // fire-and-forget
        if (ep.fireAndForget) {
          fetch(ep.url, {
            method: ep.method ?? "POST",
            headers: {
              "Content-Type": "application/json",
              ...(ep.bearerToken && {
                Authorization: `Bearer ${ep.bearerToken}`,
              }),
            },
            body: ep.method === "GET" ? undefined : JSON.stringify(input),
          }).catch((err) => {
            console.error(`Background webhook to ${ep.url} failed:`, err);
          });
          return { message: `Dispatched to ${ep.url}` };
        }

        // otherwise enforce timeout
        const controller = new AbortController();
        const timeoutMs = ep.timeoutMs ?? 5000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const res = await fetch(ep.url, {
            method: ep.method ?? "POST",
            headers: {
              "Content-Type": "application/json",
              ...(ep.bearerToken && {
                Authorization: `Bearer ${ep.bearerToken}`,
              }),
            },
            body: ep.method === "GET" ? undefined : JSON.stringify(input),
            signal: controller.signal,
          });
          const data = await res.json();
          return { status: "success" as const, data };
        } catch (err: any) {
          if (err.name === "AbortError") {
            return {
              status: "timeout" as const,
              message: `Request to ${ep.url} timed out after ${timeoutMs} ms`,
            };
          }
          return { status: "error" as const, message: err.message };
        } finally {
          clearTimeout(timeoutId);
        }
      },
    });
  });

  return tools;
}

/**
 * Defines core scheduler tools: scheduleNext, updateContext, fetchContext, sendNotification.
 */
function getCoreTools(
  client: SaaSApiClient,
  jobId: string
): Record<string, Tool> {
  return {
    scheduleNext: tool({
      description:
        "Schedule the next run. List any endpoints that are planned to be called. Give a user-friendly reason this decision was made, briefly citing any relevant context, previous messages, or job history.",
      inputSchema: z.object({
        delayMinutes: z.number(),
        endpoints: z.array(z.string()).describe("Array of endpoint IDs"),
        reason: z.string(),
      }),
      outputSchema: z.object({
        result: z.string(),
        success: z.boolean(),
      }),
      execute: async (args) => client.scheduleNext(jobId, args),
    }),

    updateContext: tool({
      description: "Store context key/value",
      inputSchema: z.object({
        key: z.string(),
        value: z.string(),
      }),
      execute: async ({ key, value }) => {
        await client.updateContext(jobId, { key, value });
        return { key, value };
      },
    }),

    fetchContext: tool({
      description: "Retrieve all context entries",
      inputSchema: z.object({}),
      execute: async () => client.getContext(jobId),
    }),

    sendNotification: tool({
      description: "Send an alert or summary notification",
      inputSchema: z.object({ message: z.string(), level: z.string() }),
      execute: async (opts) => {
        await client.sendNotification(jobId, opts);
        return { acknowledged: true };
      },
    }),
  };
}

const main = async () => {
  const jobId = "009BKh7wF5m47a"; // replace with actual job ID
  const messages: UIMessage[] = [
    {
      id: Math.random().toString(36).substring(2, 15),
      role: "system",
      parts: [
        {
          type: "text",
          text: "This is a system message",
        },
      ],
    },
    // add more messages as needed
  ];

  try {
    await runAgentForJob({ jobId, messages });
  } catch (error) {
    console.error("Error running agent:", error);
  }
};

main();
