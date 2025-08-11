# Cronicorn Scheduling Engine

The scheduling engine is a core component of the Cronicorn system that intelligently processes jobs, determines optimal scheduling, executes endpoints, and manages the job lifecycle.

## Features

- Intelligent job scheduling using AI agent
- Context-aware execution planning
- Endpoint execution with error handling and retries
- Fallback strategies for resilience
- Comprehensive metrics collection

## Usage

```typescript
import { createSchedulingEngine } from "@cronicorn/scheduling-engine";

// Create and configure the engine
const engine = createSchedulingEngine({
  database: dbClient,
  aiAgent: {
    model: "gpt-4o",
    temperature: 0.2,
    maxRetries: 2
  },
  execution: {
    maxConcurrency: 5,
    defaultTimeoutMs: 30000
  },
  metrics: {
    enabled: true
  }
});

// Start the engine
await engine.start();

// Process a single cycle
await engine.processCycle();

// Stop the engine
await engine.stop();
```

## Architecture

The scheduling engine consists of several core components:

1. **Job Scheduler**: Discovers and processes jobs based on their schedule
2. **Context Provider**: Gathers context for AI decision making
3. **AI Agent**: Makes intelligent decisions about execution and scheduling
4. **Endpoint Executor**: Executes endpoints and processes responses
5. **Metrics Collector**: Tracks performance and usage metrics

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test
```

### CLI Commands

```bash
# Start the engine
pnpm scheduling-engine:start

# Process a single cycle
pnpm scheduling-engine:process

# Check status
pnpm scheduling-engine:status
```
