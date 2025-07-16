import { seed } from "drizzle-seed";
import { db } from "./db.js";
import * as schema from "./schema.js";

const testMessages = [
  {
    role: "system",
    content: "Agent triggered by cron-job",
  },
  {
    role: "assistant",
    content: [
      {
        type: "tool-call",
        toolCallId: "call_ldOSJjbOP62iBEt4I5Lb5iKU",
        toolName: "getEvents",
        input: {},
      },
    ],
  },
  {
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: "call_ldOSJjbOP62iBEt4I5Lb5iKU",
        toolName: "getEvents",
        output: {
          type: "json",
          value: [],
        },
      },
    ],
  },
  {
    role: "assistant",
    content: [
      {
        type: "tool-call",
        toolCallId: "call_2tThc9hkUpAwGDX6yDKFl97y",
        toolName: "scheduleNext",
        input: {
          delayMinutes: 1440,
          reason:
            "No current events to monitor, so schedule next routine check for the following day.",
          priority: "low",
        },
      },
    ],
  },
  {
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: "call_2tThc9hkUpAwGDX6yDKFl97y",
        toolName: "scheduleNext",
        output: {
          type: "json",
          value: {
            nextExecutionTime: "2025-06-25T18:52:00.580Z",
            delayMinutes: 1440,
            reason:
              "No current events to monitor, so schedule next routine check for the following day.",
            priority: "low",
            message:
              "✅ Scheduled in 1440 minutes: No current events to monitor, so schedule next routine check for the following day.",
          },
        },
      },
    ],
  },
  {
    role: "assistant",
    content: [
      {
        type: "tool-call",
        toolCallId: "call_WLFWeCMyFFfsrJnv0vdSbeJ4",
        toolName: "sendDiscordMessage",
        input: {
          message:
            "ℹ️ All clear! There are no events to monitor currently. I'm scheduled to check again in 24 hours. Let me know if anything changes!",
          urgent: false,
          context:
            "There are no active events, and the next check is scheduled for tomorrow.",
        },
      },
    ],
  },
  {
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: "call_WLFWeCMyFFfsrJnv0vdSbeJ4",
        toolName: "sendDiscordMessage",
        output: {
          type: "text",
          value: "✅ Discord message sent:\n ```${discordMessage}```",
        },
      },
    ],
  },
  {
    role: "assistant",
    content: [
      {
        type: "text",
        text: "I've scheduled the next routine check for tomorrow as there are no current events to monitor. I've also sent a routine update to the admins on Discord.",
      },
    ],
  },
] as const;

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    await seed(db, schema, { count: 10 });

    // get first job
    const [firstJob] = await db.select().from(schema.jobs).limit(1);
    console.log("First job:", firstJob);

    // seed test massages to the first job
    if (firstJob) {
      await db.insert(schema.messages).values(
        testMessages.map((message) => ({
          jobId: firstJob.id,
          role: message.role,
          content: JSON.stringify(message.content),
        }))
      );
    }
    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during database seeding:", error);
    process.exit(1);
  }
}

main();
