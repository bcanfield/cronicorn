/**
 * Cronicorn Scheduling Engine
 *
 * Main entry point for the scheduling engine that handles intelligent job scheduling,
 * endpoint execution, and AI-driven decision making.
 */

import type { EngineConfig } from "@/config";

import { SchedulingEngine } from "@/engine";

/**
 * Create and initialize a new scheduling engine instance
 *
 * @param config Engine configuration
 * @returns Initialized SchedulingEngine instance
 */
export function createSchedulingEngine(config: EngineConfig) {
  return new SchedulingEngine(config);
}

export * from "./services";
export * from "@/config";
export * from "@/engine";
// Export public types and interfaces
export * from "@/types";
