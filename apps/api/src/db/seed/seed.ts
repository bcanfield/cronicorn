/* eslint-disable no-console */
import { eq } from "drizzle-orm";
import { readFileSync } from "node:fs";
import path, { join } from "node:path";
import { exit } from "node:process";
import { fileURLToPath } from "node:url";

import db from "@/api/db/index";
import { DEV_USER } from "@/api/lib/dev-user";

import * as schema from "../schema";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Get the actual user from the database
    const devUser = await db.query.users.findFirst({
      where: eq(schema.users.email, DEV_USER.email),
    });

    if (!devUser) {
      throw new Error("Dev user not found after insertion. Something went wrong.");
    }

    console.log(`Found dev user with ID: ${devUser.id}`);

    // Seed multiple jobs
    console.log("📝 Seeding jobs...");
    const jobIds = await seedJobs(devUser.id);

    // Seed API keys
    console.log("📝 Seeding API keys...");
    await seedApiKeys(devUser.id);

    // Seed context entries and endpoints for the first job
    if (jobIds.length > 0) {
      const mainJobId = jobIds[0];
      console.log(`📝 Seeding context entries and endpoints for job ${mainJobId}...`);
      await seedContextEntries(mainJobId);
      await seedEndpoints(mainJobId);

      // Seed messages from JSON file for the first job
      console.log(`📝 Seeding messages for job ${mainJobId}...`);
      await seedMessagesFromJson(mainJobId);
    }

    console.log("✅ Database seeded successfully!");
    exit(0);
  }
  catch (error) {
    console.error("❌ Error during database seeding:", error);
    console.error(error);
    process.exit(1);
  }
}

async function seedJobs(userId: string): Promise<string[]> {
  // Delete existing jobs for this user to avoid duplicates
  await db.delete(schema.jobs).where(eq(schema.jobs.userId, userId));

  const jobsData = [
    {
      definitionNL: "Monitor website performance and send daily reports",
      status: "ACTIVE" as const,
      userId,
      nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    },
    {
      definitionNL: "Analyze social media sentiment and alert on negative trends",
      status: "PAUSED" as const,
      userId,
      nextRunAt: null,
    },
    {
      definitionNL: "Generate weekly content suggestions based on trending topics",
      status: "ACTIVE" as const,
      userId,
      nextRunAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // next week
    },
    {
      definitionNL: "Summarize customer feedback and categorize by sentiment",
      status: "ARCHIVED" as const,
      userId,
      nextRunAt: null,
    },
  ];

  const jobIds: string[] = [];

  for (const jobData of jobsData) {
    const jobId = crypto.randomUUID();
    jobIds.push(jobId);

    await db.insert(schema.jobs).values({
      id: jobId,
      ...jobData,
      inputTokens: Math.floor(Math.random() * 10000),
      outputTokens: Math.floor(Math.random() * 5000),
      totalTokens: Math.floor(Math.random() * 15000),
      reasoningTokens: Math.floor(Math.random() * 2000),
      cachedInputTokens: Math.floor(Math.random() * 1000),
    });
  }

  return jobIds;
}

async function seedApiKeys(userId: string) {
  // Delete existing API keys for this user
  await db.delete(schema.apiKeys).where(eq(schema.apiKeys.userId, userId));

  const apiKeysData = [
    {
      name: "Development API Key",
      key: `dev_${crypto.randomUUID().replace(/-/g, "")}`,
      secret: crypto.randomUUID().replace(/-/g, ""),
      scopes: ["read", "write"],
      description: "Used for local development",
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      userId,
    },
    {
      name: "Production API Key",
      key: `prod_${crypto.randomUUID().replace(/-/g, "")}`,
      secret: crypto.randomUUID().replace(/-/g, ""),
      scopes: ["read", "write", "admin"],
      description: "Used for production environment",
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
      userId,
    },
    {
      name: "Read-only API Key",
      key: `ro_${crypto.randomUUID().replace(/-/g, "")}`,
      secret: crypto.randomUUID().replace(/-/g, ""),
      scopes: ["read"],
      description: "Used for read-only access",
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months
      userId,
    },
  ];

  for (const apiKeyData of apiKeysData) {
    await db.insert(schema.apiKeys).values(apiKeyData);
  }
}

async function seedContextEntries(jobId: string) {
  // Delete existing context entries for this job
  await db.delete(schema.contextEntries).where(eq(schema.contextEntries.jobId, jobId));

  const contextEntriesData = [
    {
      jobId,
      key: "user_preferences",
      value: JSON.stringify({
        theme: "dark",
        notifications: true,
        language: "en-US",
      }),
    },
    {
      jobId,
      key: "api_configuration",
      value: JSON.stringify({
        endpoint: "https://api.example.com/v1",
        timeout: 30000,
        retries: 3,
      }),
    },
    {
      jobId,
      key: "schedule",
      value: "0 9 * * 1-5", // Cron expression for weekdays at 9 AM
    },
    {
      jobId,
      key: "recipients",
      value: JSON.stringify(["user1@example.com", "user2@example.com", "user3@example.com"]),
    },
    {
      jobId,
      key: "report_format",
      value: "pdf",
    },
    {
      jobId,
      key: "metrics",
      value: JSON.stringify([
        "page_load_time",
        "server_response_time",
        "error_rate",
        "user_engagement",
      ]),
    },
    {
      jobId,
      key: "thresholds",
      value: JSON.stringify({
        page_load_time: 3000,
        error_rate: 0.05,
        server_response_time: 500,
      }),
    },
  ];

  for (const contextEntryData of contextEntriesData) {
    await db.insert(schema.contextEntries).values(contextEntryData);
  }
}

async function seedEndpoints(jobId: string) {
  // Delete existing endpoints for this job
  await db.delete(schema.endpoints).where(eq(schema.endpoints.jobId, jobId));

  const endpointsData = [
    {
      jobId,
      name: "Performance Metrics API",
      url: "https://api.example.com/metrics",
      method: "GET",
      bearerToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      requestSchema: {
        type: "object",
        properties: {
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          metrics: { type: "array", items: { type: "string" } },
        },
        required: ["startDate", "endDate", "metrics"],
      },
      timeoutMs: 10000,
    },
    {
      jobId,
      name: "Email Notification Service",
      url: "https://api.example.com/notifications/email",
      method: "POST",
      bearerToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      requestSchema: {
        type: "object",
        properties: {
          recipients: { type: "array", items: { type: "string", format: "email" } },
          subject: { type: "string" },
          body: { type: "string" },
          attachments: { type: "array", items: { type: "object" } },
        },
        required: ["recipients", "subject", "body"],
      },
      timeoutMs: 5000,
    },
    {
      jobId,
      name: "Alert Webhook",
      url: "https://alerts.example.com/webhook",
      method: "POST",
      bearerToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      requestSchema: {
        type: "object",
        properties: {
          level: { type: "string", enum: ["info", "warning", "error", "critical"] },
          message: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
          data: { type: "object" },
        },
        required: ["level", "message", "timestamp"],
      },
      timeoutMs: 3000,
      fireAndForget: true,
    },
  ];

  for (const endpointData of endpointsData) {
    await db.insert(schema.endpoints).values(endpointData);
  }
}

async function seedMessagesFromJson(jobId: string) {
  // Delete existing messages for this job
  await db.delete(schema.messages).where(eq(schema.messages.jobId, jobId));

  try {
    // Read messages from JSON file
    const messagesJsonPath = join(__dirname, "seed-data", "messages.json");
    const messagesRaw = readFileSync(messagesJsonPath, "utf8");
    const messagesData = JSON.parse(messagesRaw);

    // Insert each message
    for (const messageData of messagesData) {
      await db.insert(schema.messages).values({
        id: crypto.randomUUID(),
        jobId,
        role: messageData.role,
        content: messageData.content,
      });
    }

    console.log(`Seeded ${messagesData.length} messages for job ${jobId}`);
  }
  catch (error) {
    console.error("Error seeding messages from JSON:", error);
    throw error;
  }
}

export default seed;
