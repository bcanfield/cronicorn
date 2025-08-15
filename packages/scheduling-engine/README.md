# Cronicorn Scheduling Engine

Intelligent scheduling engine for Cronicorn that handles job processing, AI-driven decision making, and endpoint execution.

## Overview

The scheduling engine is responsible for:

- **Job Discovery**: Finding jobs that need to be processed based on schedule
- **Context Analysis**: Gathering and analyzing job context (messages, endpoint history)
- **AI Agent Orchestration**: Using AI to determine optimal actions and scheduling
- **Endpoint Execution**: Calling endpoints with appropriate context as directed by the AI agent
- **Result Processing**: Handling endpoint responses and updating job status
- **Intelligent Scheduling**: Determining the optimal next run time based on AI agent output

## Architecture

The engine operates through a two-phase AI consultation process:

### Phase 1: Execution Planning

- Receives job definition, available endpoints, and past messages
- Determines which endpoints to call and with what parameters
- Plans execution strategy (sequential vs. parallel) and dependencies
- Provides initial scheduling estimate

### Phase 2: Schedule Finalization

- Receives all previous context plus execution results
- Analyzes endpoint responses to extract timing signals
- Makes final decision on next run time based on complete data
- Recommends additional actions (retries, notifications)

## Installation

```bash
pnpm install @cronicorn/scheduling-engine
```

## Usage

### As a Library

```typescript
import { createSchedulingEngine } from "@cronicorn/scheduling-engine";

const engine = createSchedulingEngine({
  aiAgent: {
    model: "gpt-4o",
    temperature: 0.2,
    maxRetries: 2,
  },
  execution: {
    maxConcurrency: 5,
    defaultTimeoutMs: 30000,
    maxEndpointRetries: 3,
  },
  metrics: {
    enabled: true,
    trackTokenUsage: true,
  },
  scheduler: {
    maxBatchSize: 20,
    processingIntervalMs: 60000,
  },
});

// Start the engine
await engine.start();

// Process a single cycle
const result = await engine.processCycle();

// Stop the engine
await engine.stop();
```

### As a CLI Tool

```bash
# Start the engine (runs continuously)
npx cronicorn-engine start

# Run a single processing cycle
npx cronicorn-engine process

# Check engine status
npx cronicorn-engine status

# Show help
npx cronicorn-engine help
```
