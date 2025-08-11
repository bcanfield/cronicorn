# Scheduling Engine Plan

## Overview

The scheduling engine is a critical component of the Cronicorn system that will be responsible for processing jobs, making intelligent scheduling decisions, executing endpoints, and managing the overall job lifecycle. This document outlines the architecture, responsibilities, and implementation plan for the scheduling engine workspace within the monorepo.

## Database Schema Analysis

Based on the existing schema, we have identified the following key entities:

### Jobs
- `id`: Unique identifier (UUID)
- `definitionNL`: Natural language description of the job
- `nextRunAt`: Timestamp for next scheduled run
- `status`: ACTIVE, PAUSED, or ARCHIVED
- `locked`: Flag to prevent concurrent processing
- `userId`: Associated user who owns this job
- Various token fields for tracking resource usage

### Endpoints
- `id`: Unique identifier
- `name`: Human-readable name
- `url`: Endpoint URL to call
- `method`: HTTP method (GET, POST, etc.)
- `bearerToken`: Optional authentication
- `requestSchema`: JSON schema for requests
- `jobId`: Associated job
- `timeoutMs`: Maximum execution time
- `fireAndForget`: Whether to wait for response
- Size limits for requests and responses

### Messages
- `id`: Unique identifier
- `role`: system, user, assistant, or tool
- `content`: Message content (string or structured content)
- `jobId`: Associated job
- `source`: Origin of the message (endpointResponse or unknown)
- Timestamps for creation and updates

### EndpointUsage
- Tracks execution metrics for endpoints
- Records request/response sizes, execution time
- Stores success/failure information and error messages

## Scheduling Engine Responsibilities

The scheduling engine will be responsible for:

1. **Job Discovery**: Finding jobs that need to be processed based on schedule
2. **Context Analysis**: Gathering and analyzing job context (messages, endpoint history)
3. **AI Agent Orchestration**: Interfacing with the AI agent to determine actions and scheduling
4. **Intelligent Scheduling**: Determining the optimal next run time based on AI agent output
5. **Endpoint Execution**: Calling endpoints with appropriate context as directed by the AI agent
6. **Result Processing**: Handling endpoint responses and updating job status
7. **Error Handling**: Managing failures and retries
8. **Metrics Collection**: Gathering and storing execution metrics
9. **State Management**: Persisting decisions and updating job state

## Architecture

### Workspace Structure

```
packages/scheduling-engine/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                # Main entry point
│   ├── engine.ts               # Core scheduling engine
│   ├── config.ts               # Configuration interface
│   ├── types.ts                # Type definitions
│   ├── services/               # Core services
│   │   ├── job-scheduler.ts    # Handles job scheduling logic
│   │   ├── context-provider.ts # Provides context for decisions
│   │   ├── ai-agent/           # AI Agent integration
│   │   │   ├── agent.ts        # Main AI agent interface
│   │   │   ├── prompt-builder.ts # Constructs prompts for the AI
│   │   │   ├── response-parser.ts # Parses structured responses
│   │   │   └── models/         # AI model integrations
│   │   ├── endpoint-executor.ts # Executes endpoints
│   │   └── metrics-collector.ts # Collects execution metrics
│   ├── strategies/             # Scheduling fallbacks when AI unavailable
│   │   ├── base-strategy.ts    # Base strategy interface
│   │   ├── interval-based.ts   # Fixed interval scheduling
│   │   ├── adaptive.ts         # Adaptive scheduling based on context
│   │   └── custom.ts           # Custom user-defined strategies
│   ├── utils/                  # Utility functions
│   │   ├── lock-manager.ts     # Manages job locks
│   │   ├── context-analyzer.ts # Analyzes job context
│   │   ├── rate-limiter.ts     # Implements rate limiting
│   │   └── time-utils.ts       # Time manipulation utilities
│   └── tests/                  # Unit and integration tests
└── README.md                   # Documentation
```

### Core Components

#### 1. Job Scheduler

Responsible for determining which jobs need processing and when they should run next:

- Fetch jobs with `nextRunAt <= now` and `status == ACTIVE`
- Apply locking mechanism to prevent concurrent processing
- Delegate scheduling decisions to the AI agent
- Update job state after processing

#### 2. Context Provider

Gathers context needed for AI agent decisions:

- Retrieve recent messages for the job
- Format job history and endpoint responses
- Get endpoint execution history
- Prepare consolidated context for AI agent consumption

#### 3. AI Agent Interface

Acts as the decision-making core of the system with a two-phase operation:

- **Phase 1: Execution Planning**
  - Receives job definition, available endpoints, and past N messages
  - Determines which endpoints to call and with what parameters
  - Plans execution strategy (sequential vs. parallel) and dependencies
  - Provides initial scheduling estimate and reasoning
  - Tracks token usage and optimizes for efficient prompting

- **Phase 2: Schedule Finalization**
  - Receives all previous context plus execution results
  - Analyzes endpoint responses to extract timing signals
  - Makes final decision on next run time based on complete data
  - Recommends additional actions (retries, notifications)
  - Provides detailed reasoning for the scheduling decision

#### 4. Endpoint Executor

Handles the execution of endpoints as directed by the AI agent:

- Execute HTTP requests based on endpoint configuration and AI agent instructions
- Manage timeouts and handle errors
- Process responses and update job context
- Track execution metrics

#### 5. Metrics Collector

Collects and stores metrics about job and endpoint execution:

- Record execution times, request/response sizes
- Track success/failure rates
- Store token usage for AI operations
- Provide data for performance analysis

### Processing Flow

1. **Fetch Eligible Jobs**
   - Query active jobs with `nextRunAt <= currentTime`
   - Apply pagination to process in batches

2. **Lock Jobs for Processing**
   - Set `locked = true` to prevent concurrent processing
   - Use database transactions for safety

3. **For Each Job**
   - **Initial Context Gathering**
     - Fetch job details, associated endpoints, recent messages (e.g., last 20)
     - Retrieve endpoint usage history for this job
     - Format all data into a structured context object

   - **Initial AI Agent Consultation**
     - Pass job context to AI agent
     - AI analyzes job definition and history
     - AI returns endpoints to call, parameters, priorities, and a preliminary next run time
     - Store AI reasoning as a system message

   - **Endpoint Execution Phase**
     - For each endpoint in priority order:
       - Log execution start
       - Call endpoint with AI-provided parameters
       - Record endpoint usage metrics
       - Store response as a message
       - Respect execution strategy (sequential for dependent endpoints, parallel for independent ones)

   - **Final AI Agent Consultation**
     - Pass updated context including all endpoint responses to AI agent
     - AI analyzes complete execution results
     - AI determines final next run time based on all responses
     - AI provides reasoning for the schedule decision
     - Store final AI reasoning as a system message

   - **Job Update**
     - Update job.nextRunAt with final AI decision
     - Update token usage metrics

4. **Release Locks**
   - Set `locked = false` when processing completes
   - Handle timeouts and unlock stuck jobs

## Integration with Existing API

### Database Integration

The scheduling engine will use the existing database schema:

- Direct access to the database via the shared Drizzle ORM
- Read-only operations for fetching jobs and context
- Write operations for updating job state and metrics

### Authentication

The scheduling engine will:

- Use API key authentication with appropriate scopes
- Alternatively, run as a trusted internal service with direct database access
- Ensure all operations are properly authenticated and authorized

### Error Handling

The engine will implement robust error handling:

- Graceful failure handling for endpoint timeouts
- Circuit breakers for failing endpoints
- Error logging and monitoring
- Automatic job unlocking in case of failures

## AI Agent Integration

The AI agent is the central decision-making component of the scheduling engine, acting as an intelligent controller that analyzes context and determines actions.

### AI Agent Interfaces

The AI agent has two distinct interfaces for its dual-phase operation:

```typescript
interface AIAgent {
  // First phase: Initial planning before endpoint execution
  planExecution(jobContext: JobContext): Promise<AIAgentPlanResponse>;
  
  // Second phase: Final scheduling after endpoint execution
  finalizeSchedule(jobContext: JobContext, executionResults: ExecutionResults): Promise<AIAgentScheduleResponse>;
}

interface JobContext {
  job: {
    id: string;
    definitionNL: string;
    status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  };
  endpoints: Array<{
    id: string;
    name: string;
    url: string;
    method: string;
    requestSchema?: string; // JSON schema for validation
    timeoutMs: number;
    fireAndForget: boolean;
    // Other endpoint properties
  }>;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | MessageContent[];
    timestamp: string;
    source?: string; // Origin of the message
  }>;
  endpointUsage: Array<{
    endpointId: string;
    timestamp: string;
    statusCode: number;
    success: number;
    executionTimeMs: number;
    errorMessage?: string;
  }>;
}

interface ExecutionResults {
  results: Array<{
    endpointId: string;
    success: boolean;
    statusCode?: number;
    responseContent?: any;
    error?: string;
    executionTimeMs: number;
    timestamp: string;
  }>;
}

interface AIAgentPlanResponse {
  endpointsToCall: Array<{
    endpointId: string;
    parameters?: Record<string, any>;
    headers?: Record<string, string>;
    priority: number; // Order of execution
    dependsOn?: string[]; // IDs of endpoints that must complete first
    critical: boolean; // Whether failure should stop execution
  }>;
  executionStrategy: 'sequential' | 'parallel' | 'mixed';
  preliminaryNextRunAt?: Date; // Initial scheduling estimate
  reasoning: string;
  confidence: number;
}

interface AIAgentScheduleResponse {
  nextRunAt: Date;
  reasoning: string;
  confidence: number;
  recommendedActions?: Array<{
    type: 'retry_failed_endpoints' | 'pause_job' | 'modify_frequency' | 'notify_user';
    details: string;
  }>;
}
```

### AI Agent Tools & Capabilities

The AI agent is equipped with specialized tools to perform its analysis and decision-making:

#### 1. Context Analysis Tools

- **Job Definition Parser**: Extracts intent, frequency hints, and conditions from natural language
- **Message History Analyzer**: Identifies patterns and important events in past executions
- **Endpoint Performance Evaluator**: Reviews past execution metrics to identify reliability issues

#### 2. Endpoint Interaction Tools

- **Parameter Validator**: Ensures parameters match endpoint schema requirements
- **Payload Constructor**: Builds request bodies based on context and schemas
- **Dependency Analyzer**: Identifies endpoints that must be called in a specific order

#### 3. Scheduling Tools

- **Pattern Recognizer**: Identifies time-based patterns in the job history
- **Calendar Awareness**: Understands business hours, weekends, holidays
- **Urgency Evaluator**: Determines if immediate execution is needed based on context

### AI Agent Implementation

The AI agent will be implemented as a "black box" with a two-phase consultation process:

#### Phase 1: Execution Planning

1. **Receives Initial Context**
   - Job definition (natural language)
   - Available endpoints and their schemas
   - Message history (past runs, responses)
   - Endpoint usage history

2. **Plans Execution Strategy**
   - Determines which endpoints to call (if any)
   - Specifies parameters and headers for each endpoint
   - Sets execution priority and dependencies
   - Selects between sequential, parallel, or mixed execution
   - Provides a preliminary next run estimate

3. **Returns Execution Plan**
   - Structured list of endpoints to call with all necessary details
   - Execution strategy and dependencies
   - Initial scheduling estimate (may be refined after execution)
   - Confidence score and reasoning

#### Phase 2: Schedule Finalization

1. **Receives Updated Context with Execution Results**
   - All previous context plus:
   - Results from endpoint executions
   - Success/failure status for each endpoint
   - Response content and execution metrics

2. **Makes Final Scheduling Decision**
   - Analyzes endpoint responses for timing signals
   - Considers patterns in the data
   - Evaluates if any endpoint failures should affect scheduling
   - Makes final determination on optimal next run time

3. **Returns Scheduling Decision**
   - Final next run timestamp
   - Detailed reasoning for the schedule choice
   - Recommended actions (retries, notifications, etc.)
   - Confidence score for the decision

### Fallback Strategies

In case the AI agent is unavailable or fails, the system will fall back to simpler strategies:

1. **Interval-Based Strategy**
   - Regular intervals determined from job definition
   - Configurable minimum and maximum intervals

2. **Adaptive Strategy**
   - Adjusts frequency based on context analysis
   - Increases frequency when important events detected
   - Decreases frequency during periods of inactivity

3. **Custom Strategy**
   - User-defined rules for specific use cases
   - Complex conditions based on job content and responses

## Implementation Plan

### Phase 1: Core Engine Setup

1. **Create Package Structure**
   - Initialize package in monorepo
   - Setup TypeScript configuration
   - Define core interfaces

2. **Job Discovery Implementation**
   - Implement job fetching and locking
   - Create basic processing loop
   - Implement fallback scheduling strategies

3. **Context Provider**
   - Build job context aggregation
   - Implement message history retrieval
   - Create structured context objects for AI agent

### Phase 2: AI Agent Integration

1. **AI Agent Interface**
   - Define AI agent interface and response types
   - Implement prompt construction for natural language jobs
   - Develop response parsing and validation

2. **Endpoint Execution**
   - Basic HTTP client for endpoint execution
   - Error handling and timeout management
   - Response processing based on AI agent instructions

3. **Metrics Collection**
   - Implement metrics collection
   - Add performance monitoring
   - Track token usage

### Phase 3: Advanced Features

1. **AI Agent Enhancements**
   - Implement progressive prompting techniques
   - Add response caching for similar scenarios
   - Develop prompt templates for different job types
   - Add AI agent explanation capabilities for debugging

2. **Performance Optimization**
   - Add batch processing capabilities
   - Implement rate limiting and throttling
   - Add distributed locking for multi-instance support

3. **Monitoring and Observability**
   - Add comprehensive logging
   - Implement monitoring endpoints
   - Create job execution history views
   - Add AI decision auditing and visualization

## CLI Integration

The scheduling engine will include a CLI for local execution and management:

```bash
# Start the scheduling engine
pnpm scheduling-engine:start

# Run a single processing cycle
pnpm scheduling-engine:process

# Check job status
pnpm scheduling-engine:status

# Unlock stuck jobs
pnpm scheduling-engine:unlock-jobs
```

## Deployment Options

1. **Serverless Function**
   - Run as a scheduled cloud function
   - Trigger at regular intervals (e.g., every minute)
   - Scale automatically based on workload

2. **Dedicated Service**
   - Run as a dedicated microservice
   - Continuous processing loop with sleep intervals
   - Health checks and auto-recovery

3. **Embedded in API**
   - Run as part of the API service
   - Background worker thread or process
   - Shared database connection and configuration

## Security Considerations

1. **Job Isolation**
   - Ensure jobs only access their own context
   - Validate endpoints before execution
   - Enforce rate limits and quotas

2. **Authentication**
   - Use secure authentication for endpoint calls
   - Validate and sanitize all inputs
   - Store sensitive information securely

3. **Error Handling**
   - Prevent leaking sensitive information in errors
   - Implement proper logging and auditing
   - Handle malformed responses securely

## Testing Strategy

1. **Unit Testing**
   - Test individual components in isolation
   - Mock database and external dependencies
   - Test edge cases and error scenarios

2. **Integration Testing**
   - Test complete processing flows
   - Use database fixtures for realistic scenarios
   - Verify job state transitions

3. **Load Testing**
   - Test with large numbers of jobs
   - Verify performance under load
   - Identify bottlenecks and optimize

## Metrics and Monitoring

The scheduling engine will expose key metrics:

1. **Processing Metrics**
   - Jobs processed per minute
   - Average processing time
   - Success/failure rates

2. **Execution Metrics**
   - Endpoint response times
   - Error rates by endpoint
   - Request/response sizes

3. **Resource Usage**
   - CPU and memory utilization
   - Database connection usage
   - Token consumption for AI operations

## AI Agent Functionality

### Prompt Construction

The AI agent will require carefully constructed prompts to make effective decisions:

1. **System Instructions**
   - Define the agent's role and capabilities
   - Explain available actions and constraints
   - Provide formatting guidelines for responses

2. **Job Context**
   - Natural language job definition
   - History of previous runs and outcomes
   - Available endpoints and their specifications

3. **Response Structure**
   - Expected JSON structure for decisions
   - Explanation format for reasoning
   - Error handling instructions

### Example Prompt Flow - Phase 1 (Execution Planning)

```
# System Instructions
You are the Cronicorn Scheduling Agent responsible for determining:
1. Which endpoints to call for this job
2. How those endpoints should be executed (order, parameters)
3. A preliminary estimate for the next execution time

# Job Definition
${job.definitionNL}

# Available Endpoints
${endpoints.map(e => {
  const schema = e.requestSchema ? `\nSchema: ${e.requestSchema}` : '';
  return `- ${e.name}: ${e.url} (${e.method})${schema}`;
}).join('\n')}

# Recent History (Last 10 Messages)
${messages.slice(-10).map(m => `[${m.role}] ${formatTimestamp(m.timestamp)}: ${formatContent(m.content)}`).join('\n')}

# Recent Endpoint Usage (Last 5 Executions)
${endpointUsage.slice(-5).map(u => {
  const status = u.success ? 'SUCCESS' : 'FAILURE';
  return `- ${findEndpointName(u.endpointId)} (${formatTimestamp(u.timestamp)}): ${status} (${u.statusCode}) in ${u.executionTimeMs}ms`;
}).join('\n')}

# Instructions
Analyze the job definition and history to plan the execution strategy:
1. Determine which endpoints to call (if any)
2. Specify parameters and headers for each endpoint call
3. Set execution priority (order) and identify dependencies
4. Choose between sequential, parallel, or mixed execution
5. Provide a preliminary estimate for the next run time

Respond with JSON in this format:
{
  "endpointsToCall": [
    {
      "endpointId": "string",
      "parameters": { /* optional parameters */ },
      "headers": { /* optional headers */ },
      "priority": number,
      "dependsOn": ["endpoint-id-1"], // optional IDs of endpoints that must complete first
      "critical": boolean // whether failure should stop execution
    }
  ],
  "executionStrategy": "sequential|parallel|mixed",
  "preliminaryNextRunAt": "ISO-8601 timestamp",
  "reasoning": "string explanation of your decisions",
  "confidence": number // 0.0 to 1.0
}
```

### Example Prompt Flow - Phase 2 (Schedule Finalization)

```
# System Instructions
You are the Cronicorn Scheduling Agent responsible for:
1. Analyzing endpoint execution results
2. Determining the optimal time for the next job execution

# Job Definition
${job.definitionNL}

# Previous Planning Decision
${formatReasoningFromPreviousPhase(previousReasoning)}

# Endpoint Execution Results
${executionResults.map(r => {
  const status = r.success ? 'SUCCESS' : 'FAILURE';
  const details = r.error ? `Error: ${r.error}` : `Response: ${formatResponse(r.responseContent)}`;
  return `- ${findEndpointName(r.endpointId)}: ${status} (${r.statusCode}) in ${r.executionTimeMs}ms\n  ${details}`;
}).join('\n\n')}

# Instructions
Based on the job definition and execution results:
1. Determine the optimal time for the next execution
2. Provide detailed reasoning for your scheduling decision
3. Recommend any additional actions if necessary

Respond with JSON in this format:
{
  "nextRunAt": "ISO-8601 timestamp",
  "reasoning": "detailed explanation for your scheduling decision",
  "confidence": number, // 0.0 to 1.0
  "recommendedActions": [
    {
      "type": "retry_failed_endpoints|pause_job|modify_frequency|notify_user",
      "details": "explanation of the recommended action"
    }
  ]
}
```

### Response Processing

The AI agent's responses will be processed differently in each phase:

#### Phase 1 (Execution Planning) Processing
1. Validate the response structure and content
2. Extract endpoint calls and their parameters
3. Determine execution order based on priority and dependencies
4. Store preliminary scheduling estimate and reasoning as system message

#### Phase 2 (Schedule Finalization) Processing
1. Validate the response structure and content
2. Extract the final nextRunAt decision
3. Process any recommended actions
4. Update job metadata with final scheduling decision
5. Store reasoning and recommendations for audit purposes

### Error Handling and Fallbacks

The system includes robust handling for AI agent failures:

1. **Timeout Handling**: If the AI agent doesn't respond within a configured timeout:
   - Log the timeout event
   - Fall back to the interval-based strategy
   - Unlock the job for future processing

2. **Malformed Responses**: If the AI agent returns invalid data:
   - Log the validation errors
   - Fall back to the adaptive scheduling strategy
   - Store error information as system message

3. **Execution Failures**: If critical endpoints fail:
   - Consult the AI agent with failure context
   - Allow the agent to adjust scheduling based on failure
   - Apply error-specific scheduling logic if agent fails

4. **Recovery Strategy**: For repeated AI failures:
   - Implement exponential backoff for scheduling
   - Trigger alerts for human intervention
   - Auto-pause jobs with persistent failures

## Next Steps

1. Create the package structure and initial implementation
2. Develop context provider for AI agent integration
3. Implement basic AI agent interface with prompt templates
4. Add endpoint execution based on AI agent instructions
5. Implement fallback scheduling strategies
6. Add tests and documentation
7. Integrate with the existing API and database
8. Enhance AI agent capabilities and monitoring

This plan provides a framework for developing the scheduling engine with AI agent integration. As implementation progresses, we will refine the approach based on practical experience and emerging requirements.
