import { LRUCache } from "lru-cache";

// Types
interface RequestConfig extends Omit<RequestInit, "cache"> {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  useCache?: boolean;
  cacheTime?: number;
  cache?: RequestCache;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
  timestamp?: string;
  requestId?: string;
}

// Cache for GET requests
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes default
});

// Retry configuration
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 30000;

// Retryable status codes and errors
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const RETRYABLE_ERRORS = ["NetworkError", "TimeoutError", "AbortError"];

/**
 * Enhanced fetch with retry logic, caching, and error handling
 */
export async function apiClient<T = any>(url: string, config: RequestConfig = {}): Promise<T> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    cache: useCache = config.method === "GET",
    cacheTime = 1000 * 60 * 5,
    ...fetchConfig
  } = config;

  // Check cache for GET requests
  if (useCache && fetchConfig.method === "GET") {
    const cached = cache.get(url);
    if (cached) {
      console.log(`Cache hit for ${url}`);
      return cached;
    }
  }

  let lastError: ApiError | null = null;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Add request ID for tracking
      const requestId = generateRequestId();
      const headers = new Headers(fetchConfig.headers);
      headers.set("X-Request-ID", requestId);

      // Make the request
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response
      if (!response.ok) {
        const error = await createApiError(response, requestId);

        // Check if error is retryable
        if (shouldRetry(error, attempt, retries)) {
          lastError = error;
          await delay(calculateBackoff(retryDelay, attempt));
          attempt++;
          continue;
        }

        throw error;
      }

      // Parse response
      const data = await parseResponse<T>(response);

      // Cache successful GET requests
      if (useCache && fetchConfig.method === "GET") {
        cache.set(url, data, { ttl: cacheTime });
      }

      return data;
    } catch (error) {
      const apiError = normalizeError(error);

      // Check if error is retryable
      if (shouldRetry(apiError, attempt, retries)) {
        lastError = apiError;
        console.warn(`Retry attempt ${attempt + 1}/${retries} for ${url}`, apiError.message);
        await delay(calculateBackoff(retryDelay, attempt));
        attempt++;
        continue;
      }

      // Throw the error if not retryable or max retries reached
      throw apiError;
    }
  }

  // If we get here, we've exhausted all retries
  throw lastError || new Error("Max retries exceeded");
}

/**
 * Create a standardized API error
 */
async function createApiError(response: Response, requestId: string): Promise<ApiError> {
  let details;

  try {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      details = await response.json();
    } else {
      details = await response.text();
    }
  } catch {
    details = "Failed to parse error response";
  }

  const error: ApiError = new Error(getErrorMessage(response.status, details));
  error.name = "ApiError";
  error.status = response.status;
  error.code = getErrorCode(response.status);
  error.details = details;
  error.timestamp = new Date().toISOString();
  error.requestId = requestId;

  return error;
}

/**
 * Normalize any error to ApiError format
 */
function normalizeError(error: any): ApiError {
  if (error.name === "AbortError") {
    const apiError: ApiError = new Error("Request timeout");
    apiError.name = "TimeoutError";
    apiError.code = "TIMEOUT";
    apiError.timestamp = new Date().toISOString();
    return apiError;
  }

  if (error instanceof Error) {
    const apiError: ApiError = error as ApiError;
    apiError.timestamp = apiError.timestamp || new Date().toISOString();
    return apiError;
  }

  const apiError: ApiError = new Error(String(error));
  apiError.name = "UnknownError";
  apiError.timestamp = new Date().toISOString();
  return apiError;
}

/**
 * Parse response based on content type
 */
async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  if (contentType?.includes("text/")) {
    return response.text() as any;
  }

  return response.blob() as any;
}

/**
 * Determine if request should be retried
 */
function shouldRetry(error: ApiError, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) {
    return false;
  }

  // Retry on specific status codes
  if (error.status && RETRYABLE_STATUS_CODES.includes(error.status)) {
    return true;
  }

  // Retry on specific error types
  if (RETRYABLE_ERRORS.some(type => error.name?.includes(type) || error.message?.includes(type))) {
    return true;
  }

  return false;
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(baseDelay: number, attempt: number): number {
  return baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get user-friendly error message based on status code
 */
function getErrorMessage(status: number, details?: any): string {
  const messages: Record<number, string> = {
    400: "Invalid request. Please check your input.",
    401: "Authentication required. Please sign in.",
    403: "You don't have permission to access this resource.",
    404: "The requested resource was not found.",
    408: "Request timeout. Please try again.",
    409: "Conflict with existing data.",
    422: "Invalid data provided.",
    429: "Too many requests. Please slow down.",
    500: "Server error. Our team has been notified.",
    502: "Service temporarily unavailable.",
    503: "Service under maintenance.",
    504: "Gateway timeout. Please try again.",
  };

  // Use custom message from API if available
  if (details?.message) {
    return details.message;
  }

  return messages[status] || `Request failed with status ${status}`;
}

/**
 * Get error code based on status
 */
function getErrorCode(status: number): string {
  const codes: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    408: "TIMEOUT",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
    504: "GATEWAY_TIMEOUT",
  };

  return codes[status] || "UNKNOWN_ERROR";
}

/**
 * Simple delay utility
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Batch API requests with concurrency control
 */
export async function batchRequests<T>(
  requests: Array<() => Promise<T>>,
  concurrency = 3,
): Promise<Array<{ success: boolean; data?: T; error?: ApiError }>> {
  const results: Array<{ success: boolean; data?: T; error?: ApiError }> = [];
  const executing: Promise<void>[] = [];

  for (const request of requests) {
    const promise = request()
      .then(data => {
        results.push({ success: true, data });
      })
      .catch(error => {
        results.push({ success: false, error: normalizeError(error) });
      });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p),
        1,
      );
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Create a debounced API function
 */
export function debounceApi<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let resolvePromise: ((value: any) => void) | null = null;
  let rejectPromise: ((reason?: any) => void) | null = null;

  return (...args: Parameters<T>) => {
    return new Promise<ReturnType<T>>((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        if (rejectPromise) {
          rejectPromise(new Error("Debounced"));
        }
      }

      resolvePromise = resolve;
      rejectPromise = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          if (resolvePromise) {
            resolvePromise(result);
          }
        } catch (error) {
          if (rejectPromise) {
            rejectPromise(error);
          }
        }
      }, delay);
    });
  };
}

/**
 * Circuit breaker pattern for API calls
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private readonly threshold = 5,
    private readonly timeout = 60000,
    private readonly resetTimeout = 30000,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = "OPEN";
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// Export a default instance with common configuration
export const api = {
  get: <T = any>(url: string, config?: RequestConfig) => apiClient<T>(url, { ...config, method: "GET" }),

  post: <T = any>(url: string, data?: any, config?: RequestConfig) =>
    apiClient<T>(url, {
      ...config,
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json", ...config?.headers },
    }),

  put: <T = any>(url: string, data?: any, config?: RequestConfig) =>
    apiClient<T>(url, {
      ...config,
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json", ...config?.headers },
    }),

  delete: <T = any>(url: string, config?: RequestConfig) => apiClient<T>(url, { ...config, method: "DELETE" }),

  patch: <T = any>(url: string, data?: any, config?: RequestConfig) =>
    apiClient<T>(url, {
      ...config,
      method: "PATCH",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json", ...config?.headers },
    }),
};
