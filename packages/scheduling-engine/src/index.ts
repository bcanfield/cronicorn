/**
 * Cronicorn Scheduling Engine
 * 
 * Main entry point for the scheduling engine that handles intelligent job scheduling,
 * endpoint execution, and AI-driven decision making.
 */

import { SchedulingEngine } from './engine';
import type { EngineConfig } from './config';

/**
 * Create and initialize a new scheduling engine instance
 * 
 * @param config Engine configuration
 * @returns Initialized SchedulingEngine instance
 */
export function createSchedulingEngine(config: EngineConfig) {
  return new SchedulingEngine(config);
}

// Export public types and interfaces
export * from './types';
export * from './config';
export * from './engine';
export * from './services';
