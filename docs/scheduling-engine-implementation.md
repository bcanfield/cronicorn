# Scheduling Engine Implementation Details

This document tracks the implementation details of the scheduling engine, capturing design decisions, implementation patterns, and progress to maintain context across development sessions.

## Test-Driven Development Process

For the scheduling engine implementation, we're following a test-driven development (TDD) approach:

1. **Write Tests First**: 
   - Create test files before implementation
   - Define expected behavior through assertions
   - Consider edge cases and failure scenarios

2. **Implementation Workflow**:
   ```
   ┌─────────────┐     ┌─────────────┐     ┌────────────┐     ┌────────────┐
   │  Write Test  ├────►  Run Test   ├────►   Implement  ├────►  Refactor   │
   │ (Will Fail)  │     │  (Fails)   │     │  (Minimal)  │     │            │
   └─────────────┘     └─────────────┘     └────────────┘     └────────────┘
          │                                                         │
          └─────────────────────────────────────────────────────────┘
                                  Repeat
   ```

3. **Test Structure**:
   - Unit tests for individual components
   - Integration tests for component interactions
   - Mock external dependencies for isolation
   - Test for both success and failure paths

4. **Test Naming Convention**:
   - `describe('ComponentName', () => { ... })`
   - `describe('#methodName', () => { ... })`
   - `it('should do something specific', () => { ... })`

## Current Implementation Status

We have made significant progress in Phase 1, Phase 3, and Phase 4 of the implementation plan. Currently focusing on:

1. Core types and interfaces (completed)
2. Endpoint execution functionality (completed)
3. AI agent interface and prompt management (in progress)
4. Database service implementation (in progress)

### Completed Tasks

#### 1.1 Initial Package Configuration
- **1.1.1**: Created package directory structure in monorepo
  - Established under `packages/scheduling-engine`
  - Set up standard src directory structure

- **1.1.2**: Configured `package.json` with dependencies
  - Added core dependencies like node-fetch, p-queue
  - Set up dev dependencies for TypeScript, ESLint

- **1.1.3**: Set up TypeScript configuration (`tsconfig.json`)
  - Configured with strict type checking
  - Extended from root tsconfig with package-specific settings

#### 1.2 Core Types & Interfaces

- **1.2.1**: Defined `JobContext` interface for context collection
  - Created comprehensive context model to pass between components
  - Included job metadata, endpoints, messages, and execution history

- **1.2.2**: Defined `ExecutionResults` interface for endpoint responses
  - Structured to capture all relevant execution data
  - Includes timing, success/failure status, and response content

- **1.2.3**: Defined error and event types for the engine
  - Created structured error types for different failure scenarios
  - Added event types for tracking engine operations

- **1.2.4**: Created configuration interface
  - Defined modular configuration interfaces for each component
  - Implemented master configuration with component-specific sections

#### 3.1 AI Agent Interface

- **3.1.1**: Created core AI agent service interface
  - Defined clean interface for planning and scheduling
  - Used TypeScript interfaces for type safety

- **3.1.2**: Implemented planning phase integration
  - Created prompt formatting for execution planning
  - Implemented response handling and parsing

- **3.1.3**: Implemented scheduling phase integration
  - Added schedule decision logic based on execution results
  - Implemented recommendation generation

- **3.1.5**: Created context formatting for AI prompts
  - Implemented job context to prompt conversion
  - Added message and endpoint history formatting

#### 3.2-3.3 AI Prompt Engineering and Response Processing

- **3.2.1-3.2.3**: Created prompt templates and builders
  - Implemented system prompts for both planning and scheduling
  - Built prompt context formatting utilities

- **3.3.1-3.3.3**: Implemented response processing
  - Added Zod schemas for validation
  - Created structured response parsing

#### 4.1-4.3 Endpoint Execution

- **4.1.1-4.1.2**: Created HTTP client with timeout support
  - Implemented AbortController for cancellation
  - Added proper error handling for network issues

- **4.2.1-4.2.3**: Implemented execution strategies
  - Created sequential execution with priority ordering
  - Built parallel execution with concurrency control
  - Implemented dependency-based execution with circular dependency detection

- **4.3.1-4.3.2**: Implemented response processing
  - Added JSON response parsing
  - Implemented content truncation for large responses

### In Progress Tasks

#### 1.3 Database Access
- Working on database service interface and implementation
- Currently implementing connection handling and job queries

#### 3.1.4 AI Token Usage Tracking
- Planning token usage monitoring for AI operations
- Designing optimization strategies

#### 3.3.4-3.3.5 AI Response Validation
- Working on semantic validation for AI responses
- Implementing error handling for malformed responses

#### 4.2.4-4.2.5 Execution Engine Enhancements
- Planning execution progress tracking
- Designing abort capabilities

## Implementation Details

### Engine Architecture

The scheduling engine is designed with a modular architecture consisting of:

1. **Core Engine**: Central scheduling loop and job processing pipeline
2. **Database Service**: Handles all data persistence operations
3. **AI Agent Service**: Responsible for planning and scheduling decisions
4. **Endpoint Executor**: Manages HTTP calls to registered endpoints

The components are designed with clear interfaces to allow alternative implementations and easy testing.

### Key Design Decisions

#### 1. Service-based Architecture
- All major components follow a service pattern with explicit interfaces
- Each service has a default implementation that can be replaced or extended
- Services are injected into the core engine at instantiation time

#### 2. Type Safety
- Comprehensive TypeScript interfaces for all major structures
- Zod schemas for runtime validation of external data
- Consistent error handling with typed error responses

#### 3. Execution Strategies
- Support for sequential, parallel, and dependency-based execution
- Centralized queue management for controlled concurrency
- Timeout and circuit-breaking for resilience

#### 4. AI Integration
- Integration with Vercel AI SDK for structured generation
- Typed schema validation for AI responses
- Fallback mechanisms for AI service failures

### Technical Challenges

#### AI SDK Integration
- Working through type issues with the current implementation
- Need to resolve import and compatibility issues with the AI SDK
- Temporarily using placeholder implementations until integration is complete

#### Error Handling Strategy
- Implementing comprehensive error catching and reporting
- Working on ensuring proper cleanup during failures
- Developing consistent error classification and recovery approaches

### Next Steps

1. Complete database service implementation
2. Fix AI agent integration issues
3. Implement scheduler state management
4. Begin context provider implementation

## Component Details

### 1. Core Engine

```typescript
export class SchedulingEngine {
  private running: boolean = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  
  constructor(private services: SchedulingServices, private config: SchedulingConfig) {}

  async start(): Promise<void> {
    // Engine start logic
  }

  async stop(): Promise<void> {
    // Engine stop logic
  }

  async processCycle(): Promise<JobProcessingResult> {
    // Main processing cycle
  }
}
```

The core engine manages the scheduling loop and coordinates between services.

### 2. Database Service

```typescript
export interface DatabaseService {
  getJobsToProcess(limit: number): Promise<string[]>;
  lockJob(jobId: string, expiresAt: Date): Promise<boolean>;
  unlockJob(jobId: string): Promise<boolean>;
  getJobContext(jobId: string): Promise<JobContext | null>;
  // Additional methods for data persistence
}
```

The database service abstracts all data storage operations through a consistent interface.

### 3. AI Agent Service

```typescript
export type AIAgentService = {
  planExecution: (jobContext: JobContext) => Promise<AIAgentPlanResponse>;
  finalizeSchedule: (jobContext: JobContext, executionResults: ExecutionResults) => Promise<AIAgentScheduleResponse>;
};
```

The AI agent service handles planning execution strategies and determining future schedules.

### 4. Endpoint Executor

```typescript
export type EndpointExecutorService = {
  executeEndpoints: (
    jobContext: JobContext,
    executionPlan: AIAgentPlanResponse
  ) => Promise<EndpointExecutionResult[]>;
};
```

The endpoint executor manages HTTP calls to endpoints as specified by the AI agent.
