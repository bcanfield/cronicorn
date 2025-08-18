// Core engine public class - delegates heavy logic to helpers in ./engine/*
import type { EngineConfig, EventsConfig } from "./config.js";
import type { AIAgentMetricsEvent } from "./services/ai-agent/types.js";
import type { AIAgentService, DatabaseService, EndpointExecutorService } from "./services/index.js";
import type { EngineState, ProcessingResult } from "./types.js";

import { processCycle } from "./engine/process-cycle.js";
import { ApiDatabaseService, DefaultAIAgentService, DefaultEndpointExecutorService } from "./services/index.js";

/**
 * Main scheduling engine class
 *
 * Responsible for job discovery, execution, and scheduling
 */
export class SchedulingEngine {
  private config: EngineConfig;
  private state: EngineState = {
    status: "stopped",
    lastProcessingTime: null,
    stats: {
      totalJobsProcessed: 0,
      successfulJobs: 0,
      failedJobs: 0,
      totalEndpointCalls: 0,
      aiAgentCalls: 0,
      totalCyclesProcessed: 0,
      totalProcessingTimeMs: 0,
      lastCycleDurationMs: 0,
      avgCycleDurationMs: 0,
    },
  };

  private jobEscalationLevels = new Map<string, "none" | "warn" | "critical">();
  private disabledEndpointMap = new Map<string, Set<string>>();

  // Service instances
  private aiAgent: AIAgentService;
  private executor: EndpointExecutorService;
  private database: DatabaseService;
  private processingInterval: ReturnType<typeof setInterval> | null = null;

  private log: { info?: (...a: unknown[]) => void; error?: (...a: unknown[]) => void } = {};

  /**
   * Create a new scheduling engine instance
   *
   * @param config Engine configuration
   */
  constructor(config: EngineConfig, deps?: { aiAgent?: AIAgentService; executor?: EndpointExecutorService; database?: DatabaseService }) {
    this.config = config;

    // Safe logger extraction (no assertions / any)
    const rawLogger = config.logger;
    if (rawLogger && typeof rawLogger === "object") {
      if (typeof rawLogger.info === "function") {
        this.log.info = (msg: unknown, meta?: unknown) => {
          try {
            rawLogger.info?.(msg, meta);
          }
          catch {
            /* swallow */
          }
        };
      }
      if (typeof rawLogger.error === "function") {
        this.log.error = (msg: unknown, meta?: unknown) => {
          try {
            rawLogger.error?.(msg, meta);
          }
          catch {
            /* swallow */
          }
        };
      }
    }

    // metrics hook chaining
    const userHook = this.config.aiAgent.metricsHook;
    const metricsHook = (evt: AIAgentMetricsEvent): void => {
      switch (evt.type) {
        case "malformed": {
          if (evt.phase === "plan") {
            this.state.stats.malformedResponsesPlan = (this.state.stats.malformedResponsesPlan ?? 0) + 1;
          }
          else {
            this.state.stats.malformedResponsesSchedule = (this.state.stats.malformedResponsesSchedule ?? 0) + 1;
          }
          break;
        }
        case "repairAttempt": {
          if (evt.phase === "plan") {
            this.state.stats.repairAttemptsPlan = (this.state.stats.repairAttemptsPlan ?? 0) + 1;
          }
          else {
            this.state.stats.repairAttemptsSchedule = (this.state.stats.repairAttemptsSchedule ?? 0) + 1;
          }
          break;
        }
        case "repairSuccess": {
          if (evt.phase === "plan") {
            this.state.stats.repairSuccessesPlan = (this.state.stats.repairSuccessesPlan ?? 0) + 1;
          }
          else {
            this.state.stats.repairSuccessesSchedule = (this.state.stats.repairSuccessesSchedule ?? 0) + 1;
          }
          break;
        }
        case "repairFailure": {
          if (evt.phase === "plan") {
            this.state.stats.repairFailuresPlan = (this.state.stats.repairFailuresPlan ?? 0) + 1;
          }
          else {
            this.state.stats.repairFailuresSchedule = (this.state.stats.repairFailuresSchedule ?? 0) + 1;
          }
          break;
        }
      }
    };
    this.config.aiAgent.metricsHook = (evt: AIAgentMetricsEvent): void => {
      metricsHook(evt);
      userHook?.(evt);
      const persist = this.config.aiAgent.malformedPersistenceHook;
      if (persist) {
        if (evt.type === "malformed") {
          const attempts = evt.phase === "plan" ? (this.state.stats.repairAttemptsPlan ?? 0) : (this.state.stats.repairAttemptsSchedule ?? 0);
          persist({ phase: evt.phase, jobId: "unknown", category: evt.category, attempts, repaired: false });
        }
        else if (evt.type === "repairSuccess") {
          const attempts = evt.phase === "plan" ? (this.state.stats.repairAttemptsPlan ?? 0) : (this.state.stats.repairAttemptsSchedule ?? 0);
          persist({ phase: evt.phase, jobId: "unknown", category: "schema_parse_error", attempts, repaired: true });
        }
      }
    };

    // events wrapping
    const userEvents = this.config.events;
    const wrappedEvents: EventsConfig | undefined = userEvents ? { ...userEvents } : {};
    if (wrappedEvents) {
      const originalEndpointProgress = wrappedEvents.onEndpointProgress;
      wrappedEvents.onEndpointProgress = (e) => {
        const prog = this.state.progress;
        if (prog) {
          userEvents?.onExecutionProgress?.({ jobId: e.jobId, total: prog.total, completed: prog.completed });
        }
        originalEndpointProgress?.(e);
      };
    }

    this.aiAgent = deps?.aiAgent || new DefaultAIAgentService(this.config.aiAgent);
    this.executor = deps?.executor || new DefaultEndpointExecutorService(this.config.execution, wrappedEvents, this.config.logger);
    this.database = deps?.database || new ApiDatabaseService();
  }

  /**
   * Start the scheduling engine
   *
   * @returns Promise that resolves when the engine has started
   */
  async start(): Promise<void> {
    if (this.state.status === "running") {
      throw new Error("Engine is already running");
    }

    this.state.status = "running";
    this.state.startTime = new Date();

    const interval = this.config.scheduler?.processingIntervalMs ?? 60000; // Default: 1 minute

    this.processingInterval = setInterval(async () => {
      try {
        await this.processCycle();
      }
      catch (error) {
        this.log.error?.("cycle_process_error", { error: error instanceof Error ? error.message : String(error) });
      }
    }, interval);

    this.log.info?.("engine_started", { intervalMs: interval });
  }

  /**
   * Stop the scheduling engine
   *
   * @returns Promise that resolves when the engine has stopped
   */
  async stop(): Promise<void> {
    if (this.state.status !== "running") {
      return;
    }

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.state.status = "stopped";
    this.state.stopTime = new Date();

    this.log.info?.("engine_stopped");
  }

  /**
   * Process a single cycle of jobs
   *
   * @returns Processing results
   */
  async processCycle(): Promise<ProcessingResult> {
    return processCycle({
      engine: this,
      config: this.config,
      state: this.state,
      database: this.database,
      executor: this.executor,
      aiAgent: this.aiAgent,
      log: this.log,
      jobEscalationLevels: this.jobEscalationLevels,
      disabledEndpointMap: this.disabledEndpointMap,
    });
  }

  /**
   * Get current engine state
   *
   * @returns Current state of the engine
   */
  getState(): EngineState {
    return { ...this.state };
  }
}
