/**
 * Endpoint executor service
 */
import { ExecutionConfig } from '../../config';
import { JobContext, EndpointExecutionResult } from '../../types';
import { AIAgentPlanResponse } from '../ai-agent';
import { default as NodeFetch } from 'node-fetch';
import PQueue from 'p-queue';

/**
 * Interface for Endpoint Executor Service
 */
export interface EndpointExecutorService {
  /**
   * Execute endpoints according to execution plan
   * 
   * @param jobContext Current job context
   * @param executionPlan Plan from AI agent
   * @returns Execution results for all endpoints
   */
  executeEndpoints(
    jobContext: JobContext,
    executionPlan: AIAgentPlanResponse
  ): Promise<EndpointExecutionResult[]>;
}

/**
 * Default implementation of Endpoint Executor Service
 */
export class DefaultEndpointExecutorService implements EndpointExecutorService {
  private config: ExecutionConfig;
  private fetch: typeof NodeFetch;
  
  /**
   * Create a new executor service
   * 
   * @param config Execution configuration
   */
  constructor(config: ExecutionConfig) {
    this.config = config;
    this.fetch = NodeFetch;
  }
  
  /**
   * Execute endpoints according to execution plan
   * 
   * @param jobContext Current job context
   * @param executionPlan Plan from AI agent
   * @returns Execution results for all endpoints
   */
  async executeEndpoints(
    jobContext: JobContext, 
    executionPlan: AIAgentPlanResponse
  ): Promise<EndpointExecutionResult[]> {
    // Handle different execution strategies
    switch (executionPlan.executionStrategy) {
      case 'sequential':
        return this.executeSequentially(jobContext, executionPlan);
      case 'parallel':
        return this.executeInParallel(jobContext, executionPlan);
      case 'mixed':
        return this.executeWithDependencies(jobContext, executionPlan);
      default:
        throw new Error(`Unsupported execution strategy: ${executionPlan.executionStrategy}`);
    }
  }
  
  /**
   * Execute endpoints sequentially in priority order
   * 
   * @param jobContext Current job context
   * @param executionPlan Plan from AI agent
   * @returns Execution results
   */
  private async executeSequentially(
    jobContext: JobContext,
    executionPlan: AIAgentPlanResponse
  ): Promise<EndpointExecutionResult[]> {
    // Sort endpoints by priority (lower number = higher priority)
    const sortedEndpoints = [...executionPlan.endpointsToCall].sort(
      (a, b) => a.priority - b.priority
    );
    
    const results: EndpointExecutionResult[] = [];
    
    // Execute endpoints one by one in priority order
    for (const endpoint of sortedEndpoints) {
      const result = await this.executeEndpoint(jobContext, endpoint);
      results.push(result);
      
      // If endpoint is critical and failed, stop execution
      if (endpoint.critical && !result.success) {
        break;
      }
    }
    
    return results;
  }
  
  /**
   * Execute endpoints in parallel
   * 
   * @param jobContext Current job context
   * @param executionPlan Plan from AI agent
   * @returns Execution results
   */
  private async executeInParallel(
    jobContext: JobContext,
    executionPlan: AIAgentPlanResponse
  ): Promise<EndpointExecutionResult[]> {
    // Create a queue with concurrency limit
    const concurrencyLimit = executionPlan.concurrencyLimit || 
      this.config.defaultConcurrencyLimit || 
      3;
      
    const queue = new PQueue({ concurrency: concurrencyLimit });
    
    // Add all endpoints to the queue
    const promises = executionPlan.endpointsToCall.map(endpoint => 
      queue.add(() => this.executeEndpoint(jobContext, endpoint))
    );
    
    // Wait for all to complete
    const results = await Promise.all(promises);
    
    return results;
  }
  
  /**
   * Execute endpoints with dependency order
   * 
   * @param jobContext Current job context
   * @param executionPlan Plan from AI agent
   * @returns Execution results
   */
  private async executeWithDependencies(
    jobContext: JobContext,
    executionPlan: AIAgentPlanResponse
  ): Promise<EndpointExecutionResult[]> {
    const concurrencyLimit = executionPlan.concurrencyLimit || 
      this.config.defaultConcurrencyLimit || 
      3;
      
    const queue = new PQueue({ concurrency: concurrencyLimit });
    const results: EndpointExecutionResult[] = [];
    const completedEndpointIds = new Set<string>();
    const failedCriticalEndpoints = new Set<string>();
    
    // Track endpoints by ID for dependency resolution
    const endpointsById = new Map(
      executionPlan.endpointsToCall.map(endpoint => [endpoint.endpointId, endpoint])
    );
    
    // Check if all dependencies for an endpoint are satisfied
    const areDependenciesMet = (endpoint: typeof executionPlan.endpointsToCall[0]): boolean => {
      if (!endpoint.dependsOn?.length) {
        return true;
      }
      
      // Check if any dependencies are critical and failed
      const hasFailedCriticalDependency = endpoint.dependsOn.some(depId => 
        failedCriticalEndpoints.has(depId)
      );
      
      if (hasFailedCriticalDependency) {
        return false;
      }
      
      // Check if all dependencies are completed
      return endpoint.dependsOn.every(depId => completedEndpointIds.has(depId));
    };
    
    // Attempt to execute all endpoints with dependency ordering
    const executeAll = async (): Promise<void> => {
      // Find endpoints that can be executed now
      const readyEndpoints = executionPlan.endpointsToCall
        .filter(endpoint => !completedEndpointIds.has(endpoint.endpointId))
        .filter(areDependenciesMet);
      
      // If no endpoints are ready and we haven't completed all,
      // we might have a circular dependency
      if (readyEndpoints.length === 0) {
        if (completedEndpointIds.size < executionPlan.endpointsToCall.length) {
          const pendingEndpoints = executionPlan.endpointsToCall
            .filter(endpoint => !completedEndpointIds.has(endpoint.endpointId))
            .map(endpoint => endpoint.endpointId);
            
          throw new Error(`Possible circular dependency detected for endpoints: ${pendingEndpoints.join(', ')}`);
        }
        return;
      }
      
      // Execute all ready endpoints
      await Promise.all(
        readyEndpoints.map(async (endpoint) => {
          const result = await queue.add(() => this.executeEndpoint(jobContext, endpoint));
          results.push(result);
          completedEndpointIds.add(endpoint.endpointId);
          
          // If critical endpoint failed, add to failed critical set
          if (endpoint.critical && !result.success) {
            failedCriticalEndpoints.add(endpoint.endpointId);
          }
          
          // Continue with next batch if there are more endpoints
          if (completedEndpointIds.size < executionPlan.endpointsToCall.length) {
            await executeAll();
          }
        })
      );
    };
    
    // Start execution
    await executeAll();
    return results;
  }
  
  /**
   * Execute a single endpoint
   * 
   * @param jobContext Current job context
   * @param endpoint Endpoint to execute
   * @returns Execution result
   */
  private async executeEndpoint(
    jobContext: JobContext,
    endpoint: AIAgentPlanResponse['endpointsToCall'][0]
  ): Promise<EndpointExecutionResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      // Find endpoint configuration
      const endpointConfig = jobContext.endpoints.find(e => e.id === endpoint.endpointId);
      
      if (!endpointConfig) {
        throw new Error(`Endpoint ${endpoint.endpointId} not found in job context`);
      }
      
      // Build URL with parameters if GET request
      let url = endpointConfig.url;
      let body: string | null = null;
      
      // Prepare headers
      const headers: Record<string, string> = {
        ...(jobContext.job.defaultHeaders || {}),
        ...(endpointConfig.defaultHeaders || {}),
        ...(endpoint.headers || {}),
      };
      
      // Set content type if not provided
      if (endpointConfig.method !== 'GET' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      
      // Handle URL parameters for GET requests
      if (endpointConfig.method === 'GET' && endpoint.parameters) {
        const params = new URLSearchParams();
        
        Object.entries(endpoint.parameters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        
        const queryString = params.toString();
        if (queryString) {
          url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
        }
      } 
      // Handle request body for non-GET requests
      else if (endpoint.parameters) {
        body = JSON.stringify(endpoint.parameters);
      }
      
      // Set timeout
      const timeoutMs = endpointConfig.timeoutMs || this.config.defaultTimeoutMs || 10000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      // Execute the request
      const response = await this.fetch(url, {
        method: endpointConfig.method,
        headers,
        body,
        signal: controller.signal,
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Determine if request was successful
      const success = response.ok;
      const endTime = Date.now();
      
      // Try to parse response content
      let responseContent: any;
      let responseText: string = '';
      let truncated = false;
      
      try {
        responseText = await response.text();
        
        // Only truncate if over limit
        const contentLengthLimit = this.config.responseContentLengthLimit || 10000;
        
        if (responseText.length > contentLengthLimit) {
          responseText = responseText.substring(0, contentLengthLimit);
          truncated = true;
        }
        
        // Try to parse as JSON
        try {
          responseContent = JSON.parse(responseText);
        } catch (e) {
          // Not JSON, use as text
          responseContent = responseText;
        }
      } catch (e) {
        // Cannot read response
        responseContent = null;
      }
      
      // Create result
      return {
        endpointId: endpoint.endpointId,
        success,
        statusCode: response.status,
        executionTimeMs: endTime - startTime,
        timestamp,
        responseContent,
        truncated,
      };
    } catch (error) {
      // Handle errors (timeout, network issues, etc.)
      const endTime = Date.now();
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        endpointId: endpoint.endpointId,
        success: false,
        statusCode: 0,
        executionTimeMs: endTime - startTime,
        timestamp,
        error: errorMessage,
      };
    }
  }
}
