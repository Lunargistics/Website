export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class APIError extends Error {
  status: number;
  statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.statusText = statusText;
  }
}

export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = 10000, retries = 3, retryDelay = 1000, ...fetchOptions } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(`API request failed: ${response.statusText}`, response.status, response.statusText);
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt === retries) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  throw lastError || new Error("Failed to fetch after retries");
}

export async function fetchExternalAPI<T>(url: string, options: FetchOptions = {}): Promise<T | null> {
  try {
    const response = await fetchWithRetry(url, options);
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`External API error for ${url}:`, error.message);
    }
    return null;
  }
}

// Proxy endpoint for external APIs to avoid CORS
export function createProxyUrl(externalUrl: string): string {
  return `/api/proxy?url=${encodeURIComponent(externalUrl)}`;
}
