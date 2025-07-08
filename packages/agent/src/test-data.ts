// testAgent.ts
import type { ModelMessage } from "ai";

// --- 1) Stub JobConfig with sample endpoints ---
export const testConfig = {
	jobId: "test-job",
	definitionNL: `
# PURPOSE
You are a “Live-Data Scheduler” agent managing sports event monitoring with intelligent scheduling.

# INSTRUCTIONS
1. Analyze the current context and current events (each event includes its timezone) to determine what needs monitoring.  
2. Decide when to run next, then invoke 'scheduleNext' (default: next day at 15:00 UTC if omitted).  

# ADDITIONAL GUIDELINES
## Peak vs. Quiet Periods (per Event Location)
- For each event, convert its local clock:
  - **Peak** = 08:00–20:00 local time  
  - **Quiet** = hours outside that window

## Scraping Frequency Rules
- **During Peak (local)**  
  - If new items: run again in 15 min (max 6 h continuous)  
  - If none: run in 30 min  
- **During Quiet (local)**  
  - If new items: run in 1 h  
  - If none: run in 4–6 h (at least once every 12 h)  
- **After 3+ consecutive empty scrapes**: stop until daily cron at 15:00 UTC  
- Never scrape more often than every 30 min.  
- On failures: exponential backoff.

# DECISION MATRIX

| Period (local) | New Items? | Next Run Delay      |
| -------------- | ---------- | ------------------- |
| Peak & items   | yes        | 30 min              |
| Peak & empty   | no         | 30 min              |
| Quiet & items  | yes        | 1 h                 |
| Quiet & empty  | no         | 4–6 h (≥12 h min)   |
| 3+ empties     | no         | await next-day cron |
  `,
	endpoints: [
		{
			name: "getEvents",
			url: "http://localhost:3000/api/scheduler/events",
			method: "GET",
			bearerToken: "116b1c67d95dffe26c3596d166ac6bb426f36982f7bddec1494d5ca9c01668cc",
			requestSchema: {
				type: "object",
				properties: {},
				additionalProperties: false,
			},
			responseSchema: {
				type: "array",
				items: {
					type: "object",
					properties: {
						eventId: { type: "string" },
						name: { type: "string" },
						location: { type: "string" },
						dateString: { type: "string", format: "date-time" },
					},
					required: ["eventId", "name", "location", "dateString"],
					additionalProperties: false,
				},
			},
		},
		{
			name: "scrapeForUpdates",
			method: "POST",
			url: "https://6nngq2euyfknc6ecskeznys2uy0cyjzs.lambda-url.us-east-1.on.aws/",
			bearerToken: "1018a00a38785d68ad54ba4b64f61a79a3032c1a97d285dcdb7854ed38785acd",
			requestSchema: {
				type: "object",
				properties: { eventId: { type: "string" } },
				required: ["eventId"],
				additionalProperties: false,
			},
			responseSchema: {
				type: "object",
				properties: {
					eventId: { type: "string" },
					newItems: { type: "integer" },
					success: { type: "boolean" },
					timestamp: { type: "string", format: "date-time" },
				},
				required: ["eventId", "newItems", "success", "timestamp"],
				additionalProperties: false,
			},
		},
		// {
		// 	name: "sendNotification",
		// 	url: "https://example.com/notify",
		// 	requestSchema: {
		// 		type: "object",
		// 		properties: {
		// 			message: { type: "string" },
		// 			level: { type: "string" },
		// 		},
		// 		required: ["message", "level"],
		// 		additionalProperties: false,
		// 	},
		// 	responseSchema: {
		// 		type: "object",
		// 		properties: {
		// 			acknowledged: { type: "boolean" },
		// 		},
		// 		required: ["acknowledged"],
		// 		additionalProperties: false,
		// 	},
		// },
	],
} as const;

// --- 2) Stub history with a single system message ---
export const testHistory: ModelMessage[] = [{ role: "system", content: "Initial run" }];
