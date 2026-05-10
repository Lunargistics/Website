/**
 * Professional Async Error Handling System
 * Provides comprehensive error handling patterns for async operations
 */
import { monitoring } from "./monitoring";

// Error classification types
export type ErrorSeverity = "low" | "medium" | "high" | "critical";
export type ErrorCategory =
  | "network"
  | "validation"
  | "authentication"
  | "authorization"
  | "rate-limit"
  | "external-api"
  | "database"
  | "system"
  | "business-logic"
  | "unknown";

// Enhanced error interface
export interface EnhancedError extends Error {
  code?: string;
  statusCode?: number;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  context?: Record<string, any>;
  retryable?: boolean;
  userMessage?: string;
  originalError?: Error;
  timestamp?: Date;
  correlationId?: string;
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitter: boolean;
  retryableErrors: (error: Error) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

// Circuit breaker state
enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  expectedErrors: (error: Error) => boolean;
}

// Error recovery strategies
export type RecoveryStrategy = "retry" | "fallback" | "circuit-breaker" | "fail-fast" | "ignore";

export interface ErrorHandlingOptions {
  strategy: RecoveryStrategy;
  retryConfig?: Partial<RetryConfig>;
  fallbackValue?: any;
  fallbackFunction?: () => Promise<any>;
  circuitBreakerConfig?: CircuitBreakerConfig;
  timeout?: number;
  context?: Record<string, any>;
  userMessage?: string;
  silent?: boolean;
}

// Default configurations
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  exponentialBase: 2,
  jitter: true,
  retryableErrors: error => {
    const retryableCodes = ["NETWORK_ERROR", "TIMEOUT", "RATE_LIMIT", "TEMPORARY_FAILURE"];
    return retryableCodes.some(code => error.message?.includes(code) || (error as any).code === code);
  },
};

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 10000, // 10 seconds
  expectedErrors: error => {
    const expectedCodes = ["VALIDATION_ERROR", "AUTHENTICATION_ERROR"];
    return expectedCodes.some(code => error.message?.includes(code));
  },
};

// Circuit breaker registry
class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreakerState>();

  getState(key: string): CircuitBreakerState {
    return this.breakers.get(key) || new CircuitBreakerState();
  }

  setState(key: string, state: CircuitBreakerState): void {
    this.breakers.set(key, state);
  }
}

class CircuitBreakerState {
  state: CircuitState = CircuitState.CLOSED;
  failureCount: number = 0;
  lastFailureTime: number = 0;
  successCount: number = 0;

  constructor(private config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG) {}

  canExecute(): boolean {
    switch (this.state) {
      case CircuitState.CLOSED:
        return true;
      case CircuitState.OPEN:
        return Date.now() - this.lastFailureTime > this.config.resetTimeout;
      case CircuitState.HALF_OPEN:
        return true;
      default:
        return false;
    }
  }

  onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.successCount = 0;
    }
  }

  onFailure(error: Error): void {
    if (this.config.expectedErrors(error)) {
      return; // Don't count expected errors as circuit breaker failures
    }

    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  reset(): void {
    this.state = CircuitState.HALF_OPEN;
    this.failureCount = 0;
  }
}

// Global circuit breaker registry
const circuitRegistry = new CircuitBreakerRegistry();

// Error classification utilities
export function classifyError(error: Error): { category: ErrorCategory; severity: ErrorSeverity } {
  const message = error.message?.toLowerCase() || "";
  const code = (error as any).code || "";
  const statusCode = (error as any).statusCode || 0;

  // Network errors
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    code === "NETWORK_ERROR"
  ) {
    return { category: "network", severity: "medium" };
  }

  // Authentication/Authorization
  if (statusCode === 401 || message.includes("unauthorized") || message.includes("authentication")) {
    return { category: "authentication", severity: "medium" };
  }

  if (statusCode === 403 || message.includes("forbidden") || message.includes("authorization")) {
    return { category: "authorization", severity: "medium" };
  }

  // Rate limiting
  if (statusCode === 429 || message.includes("rate limit") || message.includes("too many requests")) {
    return { category: "rate-limit", severity: "low" };
  }

  // Validation errors
  if ((statusCode >= 400 && statusCode < 500) || message.includes("validation") || message.includes("invalid")) {
    return { category: "validation", severity: "low" };
  }

  // External API errors
  if (message.includes("api") || message.includes("external") || statusCode >= 500) {
    return { category: "external-api", severity: "high" };
  }

  // System errors
  if (message.includes("memory") || message.includes("disk") || message.includes("cpu")) {
    return { category: "system", severity: "critical" };
  }

  return { category: "unknown", severity: "medium" };
}

// Create enhanced error with context
export function createEnhancedError(error: Error, context?: Record<string, any>, userMessage?: string): EnhancedError {
  const { category, severity } = classifyError(error);

  const enhancedError: EnhancedError = Object.assign(error, {
    category,
    severity,
    context: context || {},
    retryable: isRetryableError(error),
    userMessage: userMessage || getDefaultUserMessage(category),
    originalError: error,
    timestamp: new Date(),
    correlationId: generateCorrelationId(),
  });

  return enhancedError;
}

function isRetryableError(error: Error): boolean {
  const { category } = classifyError(error);
  const retryableCategories: ErrorCategory[] = ["network", "rate-limit", "external-api"];
  return retryableCategories.includes(category);
}

function getDefaultUserMessage(category: ErrorCategory): string {
  const messages: Record<ErrorCategory, string> = {
    network: "Connection issue. Please check your internet connection and try again.",
    validation: "Please check your input and try again.",
    authentication: "Please sign in to continue.",
    authorization: "You don't have permission to perform this action.",
    "rate-limit": "Too many requests. Please wait a moment and try again.",
    "external-api": "Service temporarily unavailable. Please try again later.",
    database: "Data access issue. Please try again later.",
    system: "System error. Our team has been notified.",
    "business-logic": "Unable to complete the requested operation.",
    unknown: "An unexpected error occurred. Please try again.",
  };

  return messages[category] || messages.unknown;
}

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Async error handling wrapper
export async function handleAsyncOperation<T>(operation: () => Promise<T>, options: ErrorHandlingOptions): Promise<T> {
  const startTime = Date.now();
  let lastError: Error;

  try {
    // Apply timeout if specified
    if (options.timeout) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Operation timeout")), options.timeout);
      });

      return await Promise.race([operation(), timeoutPromise]);
    }

    switch (options.strategy) {
      case "retry":
        return await executeWithRetry(operation, options.retryConfig || {});

      case "circuit-breaker":
        return await executeWithCircuitBreaker(
          operation,
          options.circuitBreakerConfig || DEFAULT_CIRCUIT_BREAKER_CONFIG,
        );

      case "fallback":
        try {
          return await operation();
        } catch (error) {
          if (options.fallbackFunction) {
            return await options.fallbackFunction();
          }
          return options.fallbackValue;
        }

      case "fail-fast":
        return await operation();

      case "ignore":
        try {
          return await operation();
        } catch (error) {
          if (!options.silent) {
            console.warn("Ignored error:", error);
          }
          return undefined as T;
        }

      default:
        return await operation();
    }
  } catch (error) {
    lastError = error instanceof Error ? error : new Error(String(error));

    // Create enhanced error
    const enhancedError = createEnhancedError(
      lastError,
      {
        ...options.context,
        strategy: options.strategy,
        duration: Date.now() - startTime,
      },
      options.userMessage,
    );

    // Log error with monitoring
    monitoring.log("error", `Async operation failed: ${enhancedError.message}`, "async-handler", {
      error: enhancedError,
      strategy: options.strategy,
      duration: Date.now() - startTime,
    });

    throw enhancedError;
  }
}

// Retry implementation with exponential backoff
async function executeWithRetry<T>(operation: () => Promise<T>, retryConfig: Partial<RetryConfig>): Promise<T> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let attempt = 0;
  let lastError: Error;

  while (attempt < config.maxAttempts) {
    try {
      const result = await operation();
      if (attempt > 0) {
        monitoring.recordMetric("retry.success", 1, { attempts: attempt.toString() });
      }
      return result;
    } catch (error) {
      attempt++;
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt >= config.maxAttempts || !config.retryableErrors(lastError)) {
        monitoring.recordMetric("retry.failed", 1, { attempts: attempt.toString() });
        throw lastError;
      }

      const delay = calculateDelay(attempt, config);
      config.onRetry?.(lastError, attempt);

      monitoring.recordMetric("retry.attempt", 1, { attempt: attempt.toString() });
      await sleep(delay);
    }
  }

  throw lastError!;
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  let delay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);
  delay = Math.min(delay, config.maxDelay);

  if (config.jitter) {
    delay = delay * (0.5 + Math.random() * 0.5); // Add jitter
  }

  return Math.floor(delay);
}

// Circuit breaker implementation
async function executeWithCircuitBreaker<T>(
  operation: () => Promise<T>,
  config: CircuitBreakerConfig,
  key: string = "default",
): Promise<T> {
  const state = circuitRegistry.getState(key);

  if (!state.canExecute()) {
    monitoring.recordMetric("circuit_breaker.rejected", 1, { key });
    throw new Error(`Circuit breaker is OPEN for ${key}`);
  }

  try {
    const result = await operation();
    state.onSuccess();
    monitoring.recordMetric("circuit_breaker.success", 1, { key, state: state.state });
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    state.onFailure(err);
    monitoring.recordMetric("circuit_breaker.failure", 1, { key, state: state.state });
    throw error;
  } finally {
    circuitRegistry.setState(key, state);
  }
}

// Utility function for delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Batch error handling for multiple operations
export async function handleBatchOperations<T>(
  operations: (() => Promise<T>)[],
  options: {
    maxConcurrency?: number;
    failFast?: boolean;
    collectErrors?: boolean;
  } = {},
): Promise<{ results: (T | null)[]; errors: Error[] }> {
  const { maxConcurrency = 5, failFast = false, collectErrors = true } = options;
  const results: (T | null)[] = new Array(operations.length).fill(null);
  const errors: Error[] = [];

  const semaphore = new Semaphore(maxConcurrency);

  const promises = operations.map(async (operation, index) => {
    await semaphore.acquire();

    try {
      const result = await operation();
      results[index] = result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (collectErrors) {
        errors.push(err);
      }

      if (failFast) {
        throw err;
      }
    } finally {
      semaphore.release();
    }
  });

  if (failFast) {
    await Promise.all(promises);
  } else {
    await Promise.allSettled(promises);
  }

  return { results, errors };
}

// Semaphore for concurrency control
class Semaphore {
  private available: number;
  private waiters: (() => void)[] = [];

  constructor(count: number) {
    this.available = count;
  }

  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return;
    }

    return new Promise(resolve => {
      this.waiters.push(resolve);
    });
  }

  release(): void {
    if (this.waiters.length > 0) {
      const waiter = this.waiters.shift()!;
      waiter();
    } else {
      this.available++;
    }
  }
}

// Decorator for automatic error handling
export function withErrorHandling(options: ErrorHandlingOptions) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      return handleAsyncOperation(() => originalMethod!.apply(this, args), {
        ...options,
        context: {
          ...options.context,
          method: propertyKey,
          args: args.length,
        },
      });
    } as T;
  };
}

// Export utilities
export { CircuitState, circuitRegistry };

const asyncErrorHandler = {
  handleAsyncOperation,
  handleBatchOperations,
  withErrorHandling,
  classifyError,
  createEnhancedError,
};

export default asyncErrorHandler;
