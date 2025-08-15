#!/usr/bin/env node

/**
 * Cronicorn Scheduling Engine CLI
 *
 * Command-line interface for running and managing the scheduling engine
 */

/* eslint-disable no-console */

import { type EngineConfig, type EngineConfigInput, validateEngineConfig } from "./config.js";
import { createSchedulingEngine } from "./index.js";

// CLI argument parsing
const args = process.argv.slice(2);
const command = args[0];

/**
 * Environment variable helpers
 */
const env = {
  get(key: string): string | undefined {
    // eslint-disable-next-line node/no-process-env
    return process.env[key];
  },
  getOrDefault(key: string, defaultValue: string): string {
    // eslint-disable-next-line node/no-process-env
    return process.env[key] || defaultValue;
  },
  getNumber(key: string, defaultValue: number): number {
    // eslint-disable-next-line node/no-process-env
    const value = process.env[key];
    return value ? Number.parseInt(value, 10) : defaultValue;
  },
  getFloat(key: string, defaultValue: number): number {
    // eslint-disable-next-line node/no-process-env
    const value = process.env[key];
    return value ? Number.parseFloat(value) : defaultValue;
  },
  getBoolean(key: string, defaultValue: boolean): boolean {
    // eslint-disable-next-line node/no-process-env
    const value = process.env[key];
    return value ? value !== "false" : defaultValue;
  },
};

/**
 * Load configuration from environment variables
 */
function loadConfig(): any {
  const partial: EngineConfigInput = {
    aiAgent: {
      model: env.getOrDefault("CRONICORN_AI_MODEL", "gpt-4o"),
      temperature: env.getFloat("CRONICORN_AI_TEMPERATURE", 0.2),
      maxRetries: env.getNumber("CRONICORN_AI_MAX_RETRIES", 2),
      promptOptimization: {
        enabled: env.getBoolean("CRONICORN_PROMPT_OPT_ENABLED", true),
        maxMessages: env.getNumber("CRONICORN_PROMPT_OPT_MAX_MESSAGES", 10),
        minRecentMessages: env.getNumber("CRONICORN_PROMPT_OPT_MIN_RECENT", 3),
        maxEndpointUsageEntries: env.getNumber("CRONICORN_PROMPT_OPT_MAX_USAGE", 5),
      },
    },
    execution: {
      maxConcurrency: env.getNumber("CRONICORN_MAX_CONCURRENCY", 5),
      defaultTimeoutMs: env.getNumber("CRONICORN_DEFAULT_TIMEOUT_MS", 30000),
      maxEndpointRetries: env.getNumber("CRONICORN_MAX_ENDPOINT_RETRIES", 3),
      defaultConcurrencyLimit: env.getNumber("CRONICORN_DEFAULT_CONCURRENCY_LIMIT", 3),
      responseContentLengthLimit: env.getNumber("CRONICORN_RESPONSE_CONTENT_LENGTH_LIMIT", 10000),
      validateResponseSchemas: env.getBoolean("CRONICORN_VALIDATE_RESPONSE_SCHEMAS", true),
    },
    metrics: {
      enabled: env.getBoolean("CRONICORN_METRICS_ENABLED", true),
      samplingRate: env.getFloat("CRONICORN_METRICS_SAMPLING_RATE", 1.0),
      trackTokenUsage: env.getBoolean("CRONICORN_TRACK_TOKEN_USAGE", true),
    },
    scheduler: {
      maxBatchSize: env.getNumber("CRONICORN_MAX_BATCH_SIZE", 20),
      processingIntervalMs: env.getNumber("CRONICORN_PROCESSING_INTERVAL_MS", 60000),
      autoUnlockStaleJobs: env.getBoolean("CRONICORN_AUTO_UNLOCK_STALE_JOBS", true),
      staleLockThresholdMs: env.getNumber("CRONICORN_STALE_LOCK_THRESHOLD_MS", 300000),
      jobProcessingConcurrency: env.getNumber("CRONICORN_JOB_PROCESSING_CONCURRENCY", 1),
    },
  };
  return validateEngineConfig(partial);
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Cronicorn Scheduling Engine CLI

Usage: cronicorn-engine <command> [options]

Commands:
  start           Start the scheduling engine (runs continuously)
  process         Run a single processing cycle
  status          Check the status of the scheduling engine
  unlock-jobs     Unlock all stale jobs
  help            Show this help message

Environment Variables:
  CRONICORN_AI_MODEL                   AI model to use (default: gpt-4o)
  CRONICORN_AI_TEMPERATURE             AI temperature (default: 0.2)
  CRONICORN_AI_MAX_RETRIES             AI max retries (default: 2)
  CRONICORN_MAX_CONCURRENCY            Max concurrent endpoint executions (default: 5)
  CRONICORN_DEFAULT_TIMEOUT_MS         Default endpoint timeout (default: 30000)
  CRONICORN_MAX_ENDPOINT_RETRIES       Max endpoint retries (default: 3)
  CRONICORN_MAX_BATCH_SIZE             Max jobs per processing cycle (default: 20)
  CRONICORN_PROCESSING_INTERVAL_MS     Processing interval in ms (default: 60000)
  CRONICORN_STALE_LOCK_THRESHOLD_MS    Stale lock threshold in ms (default: 300000)
  CRONICORN_PROMPT_OPT_ENABLED         Enable prompt optimization (default: true)
  CRONICORN_PROMPT_OPT_MAX_MESSAGES    Max messages for prompt (default: 10)
  CRONICORN_PROMPT_OPT_MIN_RECENT      Min recent non-system messages kept (default: 3)
  CRONICORN_PROMPT_OPT_MAX_USAGE       Max endpoint usage entries (default: 5)

Examples:
  cronicorn-engine start              # Start the engine
  cronicorn-engine process            # Process one cycle
  cronicorn-engine status             # Check status
  cronicorn-engine unlock-jobs        # Unlock stale jobs
`);
}

/**
 * Validate required environment variables
 */
function validateConfig(_config: EngineConfig): void {
  const errors: string[] = [];

  if (!env.get("OPENAI_API_KEY")) {
    errors.push("OPENAI_API_KEY environment variable is required");
  }

  if (errors.length > 0) {
    console.error("Configuration errors:");
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
}

/**
 * Start command - runs the engine continuously
 */
async function startCommand() {
  console.log("Starting Cronicorn Scheduling Engine...");

  const config = loadConfig();
  validateConfig(config);

  const engine = createSchedulingEngine(config);

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nReceived SIGINT, shutting down gracefully...");
    await engine.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\nReceived SIGTERM, shutting down gracefully...");
    await engine.stop();
    process.exit(0);
  });

  try {
    await engine.start();
    console.log("Scheduling engine started successfully");

    // Keep the process running
    process.stdin.resume();
  }
  catch (error) {
    console.error("Failed to start scheduling engine:", error);
    process.exit(1);
  }
}

/**
 * Process command - runs a single processing cycle
 */
async function processCommand() {
  console.log("Running single processing cycle...");

  const config = loadConfig();
  validateConfig(config);

  const engine = createSchedulingEngine(config);

  try {
    const result = await engine.processCycle();

    console.log("Processing cycle completed:");
    console.log(`  Jobs processed: ${result.jobsProcessed}`);
    console.log(`  Successful: ${result.successfulJobs}`);
    console.log(`  Failed: ${result.failedJobs}`);
    console.log(`  Duration: ${result.duration}ms`);

    if (result.errors.length > 0) {
      console.log("  Errors:");
      result.errors.forEach((error) => {
        console.log(`    - ${error.jobId ? `[${error.jobId}] ` : ""}${error.message}`);
      });
    }

    process.exit(result.failedJobs > 0 ? 1 : 0);
  }
  catch (error) {
    console.error("Failed to process jobs:", error);
    process.exit(1);
  }
}

/**
 * Status command - shows engine status
 */
async function statusCommand() {
  console.log("Checking scheduling engine status...");

  const config = loadConfig();
  validateConfig(config);

  const engine = createSchedulingEngine(config);
  const state = engine.getState();

  console.log("Engine Status:");
  console.log(`  Status: ${state.status}`);
  console.log(`  Start time: ${state.startTime || "Not started"}`);
  console.log(`  Stop time: ${state.stopTime || "Not stopped"}`);
  console.log(`  Last processing: ${state.lastProcessingTime || "Never"}`);
  console.log("");
  console.log("Statistics:");
  console.log(`  Total jobs processed: ${state.stats.totalJobsProcessed}`);
  console.log(`  Successful jobs: ${state.stats.successfulJobs}`);
  console.log(`  Failed jobs: ${state.stats.failedJobs}`);
  console.log(`  Total endpoint calls: ${state.stats.totalEndpointCalls}`);
  console.log(`  AI agent calls: ${state.stats.aiAgentCalls}`);
}

/**
 * Unlock jobs command - unlocks all stale jobs
 */
async function unlockJobsCommand() {
  console.log("Unlocking stale jobs...");

  const config = loadConfig();
  validateConfig(config);

  // We need to call the API directly to unlock jobs
  // For now, show a placeholder message
  console.log("Note: Job unlocking functionality requires direct API access");
  console.log("This feature will be implemented in a future version");
  console.log("For now, stale jobs will be auto-unlocked by the scheduler");
}

/**
 * Main CLI entry point
 */
async function main() {
  try {
    switch (command) {
      case "start":
        await startCommand();
        break;

      case "process":
        await processCommand();
        break;

      case "status":
        await statusCommand();
        break;

      case "unlock-jobs":
        await unlockJobsCommand();
        break;

      case "help":
      case "--help":
      case "-h":
        printHelp();
        break;

      default:
        if (!command) {
          console.error("No command specified");
        }
        else {
          console.error(`Unknown command: ${command}`);
        }
        console.error("Use 'cronicorn-engine help' for usage information");
        process.exit(1);
    }
  }
  catch (error) {
    console.error("CLI error:", error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

export { main as runCLI };
