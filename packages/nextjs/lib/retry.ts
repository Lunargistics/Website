/**
 * Retry Logic Utilities
 * Provides comprehensive retry mechanisms with exponential backoff,
 * circuit breaker pattern, and graceful degradation
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error) => void;
  onFailure?: (error: Error) => void;
  timeout?: number;
  jitter?: boolean;
  circuitBreaker?: CircuitBreakerOptions;
}

export interface CircuitBreakerOptions {
  threshold: number;
  resetTimeout: number;
  onOpen?: () => void;
  onClose?: () => void;
}

interface CircuitBreakerState {
  failures: number;
  lastFailTime: number;
  state: "closed" | "open" | "half-open";
}

// Global circuit breaker states for different services
const circuitBreakers = new Map<string, CircuitBreakerState>();

/**
 * Default retry options
 */
const defaultOptions: Required<Omit<RetryOptions, "circuitBreaker">> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    "NetworkError",
    "TimeoutError",
    "ServiceUnavailable",
    "TooManyRequests",
  ],
  onRetry: () => {},
  onFailure: () => {},
  timeout: 30000,
  jitter: true,
};

/**
 * Retry with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // Check circuit breaker if configured
      if (opts.circuitBreaker) {
        const breakerState = checkCircuitBreaker(fn.name || "default", opts.circuitBreaker);
        if (breakerState === "open") {
          throw new Error("Circuit breaker is open. Service temporarily unavailable.");
        }
      }

      // Execute function with timeout
      const result = await withTimeout(fn(), opts.timeout);

      // Reset circuit breaker on success
      if (opts.circuitBreaker) {
        resetCircuitBreaker(fn.name || "default");
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Record circuit breaker failure
      if (opts.circuitBreaker) {
        recordCircuitBreakerFailure(fn.name || "default", opts.circuitBreaker);
      }

      // Check if error is retryable
      if (!isRetryableError(lastError, opts.retryableErrors)) {
        opts.onFailure(lastError);
        throw lastError;
      }

      // Don't retry if this was the last attempt
      if (attempt === opts.maxAttempts) {
        opts.onFailure(lastError);
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier,
        opts.jitter
      );

      // Call retry callback
      opts.onRetry(attempt, lastError);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError || new Error("Retry failed");
}

/**
 * Retry with fallback value
 */
export async function retryWithFallback<T>(
  fn: () => Promise<T>,
  fallback: T | (() => T | Promise<T>),
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await retry(fn, options);
  } catch (error) {
    console.warn("All retry attempts failed, using fallback:", error);
    return typeof fallback === "function" ? await (fallback as any)() : fallback;
  }
}

/**
 * Batch retry for multiple operations
 */
export async function batchRetry<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
  const results = await Promise.allSettled(
    operations.map((op) => retry(op, options))
  );

  return results.map((result) => {
    if (result.status === "fulfilled") {
      return { success: true, result: result.value };
    } else {
      return { success: false, error: result.reason };
    }
  });
}

/**
 * Progressive retry with degradation
 */
export async function progressiveRetry<T>(
  operations: Array<{ fn: () => Promise<T>; priority: number }>,
  options: RetryOptions = {}
): Promise<T | null> {
  // Sort by priority (lower number = higher priority)
  const sorted = [...operations].sort((a, b) => a.priority - b.priority);

  for (const operation of sorted) {
    try {
      return await retry(operation.fn, options);
    } catch (error) {
      console.warn(`Operation with priority ${operation.priority} failed:`, error);
      continue;
    }
  }

  return null;
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number,
  jitter: boolean
): number {
  let delay = Math.min(initialDelay * Math.pow(multiplier, attempt - 1), maxDelay);

  if (jitter) {
    // Add random jitter (±25% of delay)
    const jitterAmount = delay * 0.25;
    delay = delay + (Math.random() * 2 - 1) * jitterAmount;
  }

  return Math.round(delay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: Error, retryableErrors: string[]): boolean {
  // Check error name
  if (retryableErrors.some((name) => error.name.includes(name))) {
    return true;
  }

  // Check error message
  if (retryableErrors.some((name) => error.message.includes(name))) {
    return true;
  }

  // Check for network errors
  if (error.message.includes("fetch") || error.message.includes("network")) {
    return true;
  }

  // Check for HTTP status codes
  const statusMatch = error.message.match(/status[:\s]+(\d+)/i);
  if (statusMatch) {
    const status = parseInt(statusMatch[1]);
    // Retry on 5xx errors and specific 4xx errors
    return status >= 500 || status === 429 || status === 408;
  }

  return false;
}

/**
 * Circuit breaker management
 */
function checkCircuitBreaker(
  key: string,
  options: CircuitBreakerOptions
): "closed" | "open" | "half-open" {
  const state = circuitBreakers.get(key) || {
    failures: 0,
    lastFailTime: 0,
    state: "closed" as const,
  };

  // Check if circuit should be reset
  if (
    state.state === "open" &&
    Date.now() - state.lastFailTime > options.resetTimeout
  ) {
    state.state = "half-open";
    circuitBreakers.set(key, state);
  }

  return state.state;
}

function recordCircuitBreakerFailure(
  key: string,
  options: CircuitBreakerOptions
): void {
  const state = circuitBreakers.get(key) || {
    failures: 0,
    lastFailTime: 0,
    state: "closed" as const,
  };

  state.failures++;
  state.lastFailTime = Date.now();

  if (state.failures >= options.threshold && state.state === "closed") {
    state.state = "open";
    if (options.onOpen) {
      options.onOpen();
    }
  }

  circuitBreakers.set(key, state);
}

function resetCircuitBreaker(key: string): void {
  const state = circuitBreakers.get(key);
  if (state) {
    state.failures = 0;
    state.state = "closed";
    circuitBreakers.set(key, state);
  }
}

/**
 * Add timeout to promise
 */
function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Operation timed out")), timeout)
    ),
  ]);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry decorator for class methods
 */
export function RetryMethod(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return retry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

/**
 * Create a retry wrapper for fetch operations
 */
export function createRetryFetch(options: RetryOptions = {}) {
  return async function retryFetch(
    url: string,
    init?: RequestInit
  ): Promise<Response> {
    return retry(async () => {
      const response = await fetch(url, init);
      
      // Throw error for non-successful responses
      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.name = "HTTPError";
        throw error;
      }
      
      return response;
    }, options);
  };
}

/**
 * Hook for React components
 */
export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);

  const execute = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setAttempt(0);

    try {
      const result = await retry(fn, {
        ...options,
        onRetry: (attemptNum, err) => {
          setAttempt(attemptNum);
          if (options.onRetry) {
            options.onRetry(attemptNum, err);
          }
        },
      });
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fn, options]);

  return { data, error, loading, attempt, retry: execute };
}

// Import React for the hook
import * as React from "react";