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
  // Import the API key utility functions
  const { generateApiKeyAndSecret, hashApiKeySecret } = await import("@/api/lib/api-key-utils");

  // Delete existing API keys for this user
  await db.delete(schema.apiKeys).where(eq(schema.apiKeys.userId, userId));

  // Define API key configurations
  const apiKeyConfigs = [
    {
      name: "Development API Key",
      scopes: ["read", "write"],
      description: "Used for local development",
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      prefix: "dev_",
    },
    {
      name: "Production API Key",
      scopes: ["read", "write", "admin"],
      description: "Used for production environment",
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
      prefix: "prod_",
    },
    {
      name: "Read-only API Key",
      scopes: ["read"],
      description: "Used for read-only access",
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months
      prefix: "ro_",
    },
  ];

  // Create each API key with proper hashing
  for (const config of apiKeyConfigs) {
    // Generate key and secret using the same function used in the API routes
    const { key, secret } = generateApiKeyAndSecret();

    // Hash the secret - exactly how it's done in api-keys.handlers.ts
    const { hash, salt } = hashApiKeySecret(secret);

    // Store the API key with hashed secret
    await db.insert(schema.apiKeys).values({
      name: config.name,
      key,
      secret: hash, // Store the hash, not the plain secret
      secretSalt: salt, // Store the salt
      scopes: config.scopes,
      description: config.description,
      expiresAt: config.expiresAt,
      userId,
    });

    // Output the generated key and secret for development purposes
    console.log(`Created API key: ${config.name}`);
    console.log(`  Key: ${key}`);
    console.log(`  Secret: ${secret}`);
    console.log(`  (Keep this info secure - only shown during seeding)`);
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
      name: "HTTPBin Get",
      url: "https://httpbin.org/get",
      method: "GET",
      timeoutMs: 10000,
    },
    {
      jobId,
      name: "HTTPBin Post Daily Report",
      url: "https://httpbin.org/anything",
      method: "POST",
      requestSchema: JSON.stringify({
        job: "daily-report",
        timestamp: "2025-08-07T14:30:00Z",
        status: "running",
      }),
      timeoutMs: 10000,
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
