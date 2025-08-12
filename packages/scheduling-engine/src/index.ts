/**
 * Cronicorn Scheduling Engine
 *
 * Simplified entry point for the scheduling engine that handles intelligent job scheduling,
 * endpoint execution, and AI-driven decision making via API layer.
 */

import type { EngineConfig } from "./config";

import { SchedulingEngine } from "./engine";

/**
 * Create and initialize a new scheduling engine instance
 *
 * @param config Engine configuration
 * @returns Initialized SchedulingEngine instance
 */
export function createSchedulingEngine(config: EngineConfig) {
  return new SchedulingEngine(config);
}

// Export core engine and config types
export * from "./config";
export * from "./engine";

// Export engine-specific types only (API types come from API package)
export type { EngineState, ProcessingResult } from "./types";
