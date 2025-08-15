# Scheduling Engine Implementation Tasks

This document outlines the step-by-step tasks for implementing the scheduling engine workspace based on the architecture described in the scheduling engine plan. Each task is designed to be focused, testable, and commitable to provide clear progress markers.

## 🎯 CURRENT STATUS & NEXT STEPS

**Architecture Status**: ✅ **EXCELLENT** – Core services + orchestration loop (processCycle + worker pool) implemented, token usage now persisted
**Implementation Status**: 🟢 **CORE LOOP OPERATIONAL** – Concurrency, state transitions, performance + token metrics in place
**Next Critical Task**: **3.2.5 Prompt testing utilities** (to lock in optimization changes)

### 🚀 Immediate Next Steps (Priority Order):

1. **HIGH**: 3.2.5 Prompt testing utilities
2. **HIGH**: 3.3.4 Semantic validation for AI responses
3. **HIGH**: 3.3.5 Robust malformed response handling
4. **HIGH**: 4.1.3 HTTP retry logic for transient endpoint failures
5. **MEDIUM**: 4.2.4 Execution progress tracking
6. **MEDIUM**: 4.2.5 Execution abort capabilities
7. **MEDIUM**: 5.1.3 Enhanced error recovery (structured retry/backoff framework)
8. **LOW**: 3.4.x fallback strategies (after semantic validation & retries)

### 📊 Progress Summary:
- ✅ **Phase 1**: Package setup and core types (100%)
- ✅ **Phase 2**: Core components via API layer (100%)
- ✅ **Phase 3**: AI Agent integration (now 80% – remaining: 3.2.5, 3.3.4, 3.3.5, 3.4.x)
- ✅ **Phase 4**: Endpoint execution (60% – retries, circuit breaker, logging, progress/abort pending)
- 🟡 **Phase 5**: Engine integration (50% – loop & pipeline done: 5.1.1, 5.1.2; need 5.1.3–5.1.5 + CLI/events)
- 🔶 **Phase 6**: Testing (35% – unit coverage good for engine core; lacks integration/perf suites)
- 🔶 **Phase 7**: Production readiness (15%)

---

## Test-Driven Development Process

To ensure quality and maintainability, we'll follow a test-driven development approach for all components:

1. **Write Test First**: 
   - Define the expected behavior in a test file before implementing
   - Structure tests around component interfaces and expected outcomes
   - Include edge cases and error scenarios

2. **Implement Minimally**: 
   - Write the minimal code needed to make tests pass
   - Focus on interface compliance first, then optimization

3. **Refactor**: 
   - Clean up implementation while keeping tests passing
   - Extract common patterns and improve readability

4. **Document**:
   - Update implementation details in the documentation
   - Add JSDoc comments to clarify complex parts

Each task below should follow this workflow, with tests committed alongside implementation code.

## Phase 1: Package Setup & Core Structure

### 1.1 Initial Package Configuration

- [x] **1.1.1**: Create package directory structure in monorepo
- [x] **1.1.2**: Configure `package.json` with dependencies
- [x] **1.1.3**: Set up TypeScript configuration (`tsconfig.json`)
- [x] **1.1.4**: Configure build scripts and entry points
- [x] **1.1.5**: Add README.md with workspace overview

### 1.2 Core Types & Interfaces

- [x] **1.2.1**: Define `JobContext` interface for context collection
- [x] **1.2.2**: Define `ExecutionResults` interface for endpoint responses
- [x] **1.2.3**: Define error and event types for the engine
- [x] **1.2.4**: Create configuration interface
- [x] **1.2.5**: Define scheduler state interfaces

### 1.3 API Integration Layer (NEW - Replaces Direct Database Access)

- [x] **1.3.1**: Implement complete scheduler API routes (9 endpoints)
- [x] **1.3.2**: Create API-based database service
- [x] **1.3.3**: Implement job context retrieval via API
- [x] **1.3.4**: Add execution plan and results recording via API
- [x] **1.3.5**: Implement metrics and error tracking via API

## Phase 2: Core Engine Components

### 2.1 Job Scheduler

- [x] **2.1.1**: Implement job discovery logic (via API)
- [x] **2.1.2**: Create locking mechanism for jobs (via API)
- [x] **2.1.3**: Implement job unlocking and safety mechanisms (via API)
- [x] **2.1.4**: Add job batch processing capabilities
- [x] **2.1.5**: Create job state transition management

### 2.2 Context Provider

- [x] **2.2.1**: Implement job context assembly (via API)
- [x] **2.2.2**: Create endpoint history collection (via API)
- [x] **2.2.3**: Implement message history collection (via API)
- [x] **2.2.4**: Add context formatting utilities
- [x] **2.2.5**: Create context serialization for AI agent

### 2.3 Metrics Collection

- [x] **2.3.1**: Implement execution metrics tracking (via API)
- [x] **2.3.2**: Add token usage tracking for AI operations (via API)
- [x] **2.3.3**: Create metrics storage in database (via API)
- [x] **2.3.4**: Implement performance tracking in engine
- [x] **2.3.5**: Add metrics reporting utilities (via API)

## Phase 3: AI Agent Integration

### 3.1 AI Agent Interface

- [x] **3.1.1**: Create core AI agent service interface
- [x] **3.1.2**: Implement planning phase integration
- [x] **3.1.3**: Implement scheduling phase integration
- [x] **3.1.4**: Add token usage tracking and optimization (in-memory accumulation)
  - [x] **3.1.4a**: Persist token usage per cycle/job to database & expose via metrics (implemented: updateJobTokenUsage route + engine persistence)
- [x] **3.1.5**: Create context formatting for AI prompts

### 3.2 Prompt Engineering

- [x] **3.2.1**: Create system instruction templates
- [x] **3.2.2**: Implement planning phase prompt builder
- [x] **3.2.3**: Implement scheduling phase prompt builder
- [x] **3.2.4**: Add context-aware prompt optimization *(implemented: configurable trimming of messages & usage history via promptOptimization config)*
- [x] **3.2.5**: Create prompt testing utilities *(added shared optimizeJobContext + analyzePromptOptimization with token estimate + dedicated tests)*

### 3.3 Response Processing

- [x] **3.3.1**: Implement schema validation for AI responses
- [x] **3.3.2**: Create planning phase response parser
- [x] **3.3.3**: Create scheduling phase response parser
- [x] **3.3.4**: Add semantic validation for responses *(implemented: validatePlanSemantics & validateScheduleSemantics with strict/non-strict modes + tests)*
- [ ] **3.3.5**: Implement error handling for malformed responses
  - [x] **3.3.5.a** Basic single-attempt repair flow (deterministic retry for schema/semantic failures)
  - [ ] **3.3.5.b** Response classification taxonomy (schema_parse_error, semantic_violation, empty_response, invalid_enum_value, structural_inconsistency, repair_failed)
  - [ ] **3.3.5.c** Metrics instrumentation (malformedResponses, repairAttempts, repairSuccesses, repairFailures by phase)
  - [ ] **3.3.5.d** Configurable multi-attempt repair (maxRepairAttempts)
  - [ ] **3.3.5.e** Salvage partial structures (drop invalid endpoints / dependencies) when non-strict
  - [ ] **3.3.5.f** Persist malformed response metadata (classification + attempts) for later analytics
  - [ ] **3.3.5.g** Structured error surface (MalformedResponseError type) & propagation

### 3.4 Fallback Strategies

- [ ] **3.4.1**: Create base strategy interface
- [ ] **3.4.2**: Implement interval-based fallback strategy
- [ ] **3.4.3**: Create adaptive fallback strategy
- [ ] **3.4.4**: Add strategy selection logic
- [ ] **3.4.5**: Implement graceful degradation mechanism

## Phase 4: Endpoint Execution

### 4.1 HTTP Client

- [x] **4.1.1**: Create base HTTP client for endpoint execution
- [x] **4.1.2**: Implement timeout and cancellation support
- [ ] **4.1.3**: Add retry logic for transient failures
- [ ] **4.1.4**: Implement circuit breaker for failing endpoints
- [ ] **4.1.5**: Add request/response logging

### 4.2 Execution Engine

- [x] **4.2.1**: Implement sequential execution strategy
- [x] **4.2.2**: Implement parallel execution strategy
- [x] **4.2.3**: Create mixed/dependency-based execution strategy
- [ ] **4.2.4**: Add execution progress tracking
- [ ] **4.2.5**: Implement execution abort capabilities

## Phase 5: Core Engine Integration - **CRITICAL PATH**

### 5.1 Main Engine Loop

- [x] **5.1.1**: Create main scheduling loop (interval + processCycle)
- [x] **5.1.2**: Implement job processing pipeline (lock → plan → execute → summarize → schedule → unlock)
- [ ] **5.1.3**: Add enhanced error handling and recovery (categorize, retry policies, escalation)
- [ ] **5.1.4**: Implement graceful shutdown
- [ ] **5.1.5**: Add startup and initialization logic (self-checks, warm-up)

### 5.2 CLI Integration (pending start)

- [ ] **5.2.x** tasks unchanged

### 5.3 Event System (pending start)

- [ ] **5.3.x** tasks unchanged

## Phase 6: Testing & Quality

### 6.1 Integration Test Suite
- [ ] **6.1.1**: Engine ↔ API round‑trip tests (lock → plan → execute → schedule persistence)
- [ ] **6.1.2**: Multi-job concurrent cycle integration test
- [ ] **6.1.3**: Failure path integration (plan error, endpoint error, schedule error)
- [ ] **6.1.4**: Token usage persistence end-to-end validation

### 6.2 AI Prompt / Response Quality
- [ ] **6.2.1**: Baseline prompt snapshot tests (pre-optimization)
- [ ] **6.2.2**: Optimized prompt snapshot comparison
- [ ] **6.2.3**: Structured response regression tests (schema evolution guard)
- [ ] **6.2.4**: Malformed response fixture suite (feeds 3.3.5)

### 6.3 Performance & Load
- [ ] **6.3.1**: Cycle throughput benchmark harness
- [ ] **6.3.2**: Concurrency scaling test (1, 5, 10 workers)
- [ ] **6.3.3**: Latency distribution reporting (p50/p95)
- [ ] **6.3.4**: Token cost per cycle tracking test

### 6.4 Reliability & Stress
- [ ] **6.4.1**: Lock contention simulation (duplicate lock attempts)
- [ ] **6.4.2**: Endpoint failure storm (>=70% failure rate) resilience test
- [ ] **6.4.3**: Slow endpoint timeout enforcement test
- [ ] **6.4.4**: Forced crash recovery test (mid-cycle unlock verification)

### 6.5 Coverage & Quality Gates
- [ ] **6.5.1**: Enforce coverage thresholds (engine >=85%, AI services >=80%)
- [ ] **6.5.2**: Add coverage diff check (fail PR on drop >2%)
- [ ] **6.5.3**: Mutation testing spike (evaluate stryker-js) *(optional)*

### 6.6 Prompt Optimization Regression
- [ ] **6.6.1**: Track tokens before/after optimization (assert non-regression)
- [ ] **6.6.2**: Ensure relevance filter never drops required system instructions
- [ ] **6.6.3**: Guard against over-truncation (min context floor)

### 6.7 Test Infrastructure
- [ ] **6.7.1**: Test utility factories for jobs / endpoints / histories
- [ ] **6.7.2**: Shared mock AI agent behavior matrix
- [ ] **6.7.3**: Deterministic randomization utilities

### 6.8 CI Optimization
- [ ] **6.8.1**: Split fast vs slow test groups
- [ ] **6.8.2**: Parallelize via Vitest shards
- [ ] **6.8.3**: Cache prompt snapshots between runs

## Phase 7: Production Readiness & Ops

### 7.1 Configuration & Validation
- [ ] **7.1.1**: Central config schema (zod) + runtime validation
- [ ] **7.1.2**: Safe defaults & override precedence docs
- [ ] **7.1.3**: Misconfiguration error surfaces (fail fast)

### 7.2 Health & Probes
- [ ] **7.2.1**: Liveness probe (loop heartbeat)
- [ ] **7.2.2**: Readiness probe (dependencies + warm-up complete)
- [ ] **7.2.3**: Metrics endpoint exposure design

### 7.3 Observability (Logging)
- [ ] **7.3.1**: Structured log contexts (jobId, cycleId)
- [ ] **7.3.2**: Correlation ID propagation across services
- [ ] **7.3.3**: Log volume tuning & sampling rules

### 7.4 Metrics Export
- [ ] **7.4.1**: Prometheus/OpenTelemetry adapter abstraction
- [ ] **7.4.2**: Metric naming conventions & cardinality audit
- [ ] **7.4.3**: Export cycle performance & token usage gauges

### 7.5 Alerting & Monitoring
- [ ] **7.5.1**: Failure rate alert thresholds
- [ ] **7.5.2**: Stalled job detection alert
- [ ] **7.5.3**: Token spike anomaly detection baseline

### 7.6 Graceful Shutdown & Draining
- [ ] **7.6.1**: Drain worker pool (no new locks, finish in-flight)
- [ ] **7.6.2**: Forced unlock safeguard after timeout
- [ ] **7.6.3**: Shutdown integration test

### 7.7 Retry & Backoff Tuning
- [ ] **7.7.1**: Data-driven retry configuration (capture failure taxonomy)
- [ ] **7.7.2**: Adaptive backoff (exponential + jitter)
- [ ] **7.7.3**: Retry exhaustion escalation path

### 7.8 Circuit Breaker Telemetry
- [ ] **7.8.1**: Capture open/half-open/close transitions
- [ ] **7.8.2**: Reset strategy & cooldown configuration
- [ ] **7.8.3**: Endpoint health dashboard metrics

### 7.9 Security & Secrets
- [ ] **7.9.1**: Secrets boundary review (API keys, tokens)
- [ ] **7.9.2**: Sensitive log scrubbing
- [ ] **7.9.3**: Principle of least privilege audit

### 7.10 Hardening & Resource Limits
- [ ] **7.10.1**: Timeout budget review (AI, HTTP, cycle)
- [ ] **7.10.2**: Memory & concurrency caps exposure
- [ ] **7.10.3**: Defensive guards (max endpoints per job, max plan size)

### 7.11 Deployment Runbook
- [ ] **7.11.1**: Cold start checklist
- [ ] **7.11.2**: Rollback procedure
- [ ] **7.11.3**: Capacity planning notes

### 7.12 Documentation & Tuning Guide
- [ ] **7.12.1**: Ops tuning matrix (latency vs cost vs accuracy)
- [ ] **7.12.2**: Failure scenario playbook
- [ ] **7.12.3**: Metrics & alert interpretation guide

## ✅ Recent Completion Notes
- Token usage persistence added (API route + engine calls after plan & schedule) — eliminates in-memory only limitation for reporting.
- Performance metrics captured per cycle (avg, last, total time) — ready for future dashboard.
- Execution status transitions (RUNNING / FAILED) instrumented.
- Context-aware prompt optimization added (limits historical messages & endpoint usage slices; configurable via aiAgent.promptOptimization).
- Prompt testing utilities implemented (shared module + tests verifying trimming, floors, token reduction, preservation guarantees).
- Semantic validation added (plan & schedule issues flagged; strict mode throws, non-strict annotates reasoning; fully tested).
- Malformed response handling (initial): basic deterministic repair attempt implemented (3.3.5.a); remaining taxonomy, metrics, multi-attempt repair, salvage, persistence, and structured error surface scheduled.

## 🎯 Rationale for Next Task (3.2.5)
Add prompt testing utilities to quantify optimization impact (token delta, reasoning retention) and guard against regressions before adding semantic validation.

## 🎯 Rationale for Next Task (3.3.5)
Implement robust malformed response handling (schema mismatch, partial outputs, repair attempts) to harden AI integration before fallback strategies.

## Success Criteria

The scheduling engine implementation will be considered successful when:

1. Jobs are automatically discovered and processed on schedule
2. The AI agent is properly integrated for intelligent scheduling
3. Endpoints are executed as directed by the AI agent
4. The system gracefully handles failures and retries
5. All tests pass and coverage meets targets
6. The system performs well under load
7. Documentation is complete and accurate