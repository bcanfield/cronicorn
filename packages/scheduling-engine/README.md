# Cronicorn Scheduling Engine

Intelligent scheduling engine for Cronicorn that handles job processing, AI-driven decision making, and endpoint execution.

## Workspace Overview

This package provides a self-contained, API-driven scheduling engine that:

- Discovers due jobs through the API (no direct DB coupling)
- Builds contextual state (messages, endpoint usage, endpoints)
- Consults an AI agent in two phases (plan + schedule) to decide which endpoints to call and when to run next
- Executes endpoints with sequential / parallel / mixed strategies
- Records execution results & metrics back through scheduler API routes

It is designed to be:

- Portable (only depends on the public API & OpenAI model)
- Observable (metrics hooks & state reporting – performance tracking pending)
- Extensible (future event system & fallback strategies)

## Architecture

### High-Level Flow

1. Fetch job IDs needing work (batch)
2. Lock each job (optimistic API lock)
3. Fetch job context (messages, endpoints, usage)
4. AI Phase 1: plan execution (which endpoints + strategy)
5. Execute endpoints (collect results + partial stats)
6. AI Phase 2: finalize next schedule
7. Persist results, plan, schedule, errors
8. Unlock job

```
Job → Context → Plan(AI) → Execute → Results → Schedule(AI) → Persist → Unlock
```

### Core Services

| Service                 | Responsibility                                             |
| ----------------------- | ---------------------------------------------------------- |
| DatabaseService (API)   | All persistence & data retrieval via API client            |
| AIAgentService          | Structured planning & scheduling responses (zod validated) |
| EndpointExecutorService | Strategy-based endpoint invocation & aggregation           |
| SchedulingEngine        | Orchestration, stats, lifecycle                            |

## Configuration

Use `EngineConfig` (factory: `createSchedulingEngine(config)`). Missing subfields are defaulted.

```ts
const engine = createSchedulingEngine({
  aiAgent: { model: "gpt-4o", temperature: 0.2 },
  execution: { maxConcurrency: 5, defaultTimeoutMs: 30_000 },
  metrics: { enabled: true, trackTokenUsage: true },
  scheduler: { maxBatchSize: 20, processingIntervalMs: 60_000 }
});
```

### Environment Variables (CLI)

| Variable                          | Purpose                  | Default |
| --------------------------------- | ------------------------ | ------- |
| OPENAI_API_KEY                    | Required for AI agent    | (none)  |
| CRONICORN_AI_MODEL                | Model name               | gpt-4o  |
| CRONICORN_AI_TEMPERATURE          | Sampling temperature     | 0.2     |
| CRONICORN_AI_MAX_RETRIES          | AI call retries          | 2       |
| CRONICORN_MAX_CONCURRENCY         | Endpoint parallelism cap | 5       |
| CRONICORN_DEFAULT_TIMEOUT_MS      | Endpoint timeout         | 30000   |
| CRONICORN_MAX_ENDPOINT_RETRIES    | (future retry impl)      | 3       |
| CRONICORN_MAX_BATCH_SIZE          | Jobs per cycle           | 20      |
| CRONICORN_PROCESSING_INTERVAL_MS  | Loop interval ms         | 60000   |
| CRONICORN_STALE_LOCK_THRESHOLD_MS | Lock stale ms            | 300000  |

## Usage

### Library

```ts
import { createSchedulingEngine } from "@cronicorn/scheduling-engine";
const engine = createSchedulingEngine({ /* config */ });
await engine.start();
// ... later
await engine.stop();
```

### Single Cycle

```ts
const result = await engine.processCycle();
// Access result.successfulJobs / result.failedJobs as needed
```

### CLI

```bash
npx cronicorn-engine start       # continuous loop
npx cronicorn-engine process     # single cycle
npx cronicorn-engine status      # show in-memory stats (ephemeral)
npx cronicorn-engine unlock-jobs # (placeholder)
```

## Development

From repo root:

```bash
pnpm build        # builds all workspaces including this one
pnpm test -F @cronicorn/scheduling-engine # run tests for this package only (if using filter)
```

Directly:

```bash
cd packages/scheduling-engine
pnpm dev          # tsc --watch
pnpm test         # vitest run
pnpm start:dev    # run CLI start with tsx
```

## Testing

- Unit tests cover engine orchestration (success paths + errors)
- AI agent tests validate schema enforcement & error wrapping
- Public surface test ensures defaults & exports
- Pending: integration (API mocked end‑to‑end), performance, retry/circuit breaker tests

## Current Limitations / TODO

- Batch processing enhancements (2.1.4) – current loop is simple per-job iteration
- Job state transitions beyond lock/unlock not formalized (2.1.5)
- Performance tracking & advanced metrics (2.3.4) not implemented
- Token optimization (3.1.4), prompt optimization (3.2.4), semantic validation (3.3.4/5)
- Fallback strategies (3.4.x), retries & circuit breaker (4.1.3/4), progress tracking & abort (4.2.4/5)
- Graceful shutdown enhancements & startup init (5.1.4/5)
- CLI unlock-jobs real implementation (5.2.5)
- Event system (5.3.x) incomplete
- Broader test harness & perf testing (Phase 6)
- Logging/monitoring/security hardening (Phase 7)

## Engine State & Stats

Example shape returned by `engine.getState()`:

```
{
  status: 'running' | 'stopped' | 'paused' | 'error',
  startTime?: Date
  stopTime?: Date
  lastProcessingTime: Date | null
  stats: {
    totalJobsProcessed: number
    successfulJobs: number
    failedJobs: number
    totalEndpointCalls: number
    aiAgentCalls: number
  }
}
```

## Extensibility Roadmap

Planned abstractions:

- Pluggable fallback strategy selection
- Event emitter hooks (beforePlan, afterExecute, onError, etc.)
- Custom metrics collectors / exporters
- Advanced retry / backoff profiles

## Contributing

1. Pick a task from `docs/scheduling-engine-tasks.md`
2. Write a failing test (or enhance existing)
3. Implement minimal code to pass
4. Refactor & document
5. Mark task as complete in tasks doc

## License

MIT (inherits repository license)

## Changelog

Not yet versioned – early 0.x iteration.

---

_This README satisfies Phase 1 task 1.1.5 (workspace overview & usage)._
