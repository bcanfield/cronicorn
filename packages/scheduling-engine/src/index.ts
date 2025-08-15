/**
 * Cronicorn Scheduling Engine
 *
 * Simplified entry point for the scheduling engine that handles intelligent job scheduling,
 * endpoint execution, and AI-driven decision making via API layer.
 */

import type { EngineConfig, EngineConfigInput } from "./config.js";

import { validateEngineConfig } from "./config.js";
import { SchedulingEngine } from "./engine.js";

/**
 * Create and initialize a new scheduling engine instance
 *
 * @param config Partial engine configuration
 * @returns Initialized SchedulingEngine instance
 */
export function createSchedulingEngine(config: EngineConfigInput): SchedulingEngine {
  const validated: EngineConfig = validateEngineConfig(config || {});
  return new SchedulingEngine(validated);
}

// Export core engine and config types
export * from "./config.js";
export * from "./engine.js";

// Export engine-specific types only (API types come from API package)
export type { EngineState, ProcessingResult } from "./types.js";
