import type { Endpoint as DbEndpoint } from "@cronicorn/database";

/**
 * Build the system prompt for the Cloud Scheduler Agent.
 *
 * @param nlLogic - The natural language job definition provided by the user.
 * @param endpoints - Array of user-defined webhook tool configurations.
 * @returns A formatted system prompt string.
 */
export function buildSystemPrompt(
  nlLogic: string,
  endpoints: DbEndpoint[]
): string {
  const now = new Date().toISOString();

  // Predefined tools description
  const coreTools = [
    {
      name: "scheduleNext",
      signature: "{ delayMinutes: number, reason: string }",
    },
    { name: "updateContext", signature: "{ key: string, value: any }" },
    { name: "fetchContext", signature: "()" },
  ];

  // Format the core tools section
  const coreSection = coreTools
    .map(
      (t) =>
        `• **${t.name}(input: ${t.signature})** - pre-defined scheduling primitive`
    )
    .join("\n");

  // Format the user-defined webhook tools section

  //   export const endpoints = pgTable("Endpoint", {
  // 	id: text("cuid")
  // 	  .primaryKey()
  // 	  .$defaultFn(() => createId()),
  // 	name: text("name").notNull(),
  // 	url: text("url").notNull(),
  // 	method: text("method").default("GET").notNull(),

  // 	requestSchema: json("requestSchema"),

  //   });

  const userSection = endpoints
    .map(
      (ep) => `• **${ep.name}(...)** - calls webhook at ${ep.url}\n
			Method: ${ep.method}\n
			Request Schema: ${JSON.stringify(ep.requestSchema, null, 2)}`
    )
    .join("\n");

  return `You are the Cloud Scheduler Agent for a developer-facing SaaS platform that manages flexible, AI-driven cron jobs. 

You are initially provided with:

1. The user's job definition (natural-language logic + parsed rules).
2. A window of previous messages (LLM prompts, tool calls, responses).
3. The user-defined webhook endpoints that can be invoked.

Your job is to:

1. Fetch the latest context key/value store.
2. Decide what actions to take on this run.
3. Invoke the appropriate tools in the correct order.
4. Persist any new context or scheduling decisions.
5. Schedule the next invocation.

Current timestamp: ${now}

**Core Tools:**
${coreSection}

**User-Defined Webhook Endpoints:**
${userSection}

**Job Logic to Follow:**
${nlLogic}
`;
}
