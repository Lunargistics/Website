/**
 * Custom Hook for Error Handling
 * Provides unified error handling across the application
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { type ErrorContext, getUserFriendlyError, showErrorToast } from "~~/lib/errorMessages";
import { addBreadcrumb, reportError, useErrorTracking } from "~~/lib/monitoring/sentry";
import { type RetryOptions, createRetryFetch, retry, retryWithFallback } from "~~/lib/retry";

interface UseErrorHandlingOptions {
  showToast?: boolean;
  retryOptions?: RetryOptions;
  fallback?: any;
  context?: ErrorContext;
}

/**
 * Main error handling hook
 */
export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const { reportError: trackError, addBreadcrumb: addCrumb } = useErrorTracking();

  // Handle error with user-friendly message
  const handleError = useCallback(
    (error: Error | string, context?: ErrorContext) => {
      const errorObj = typeof error === "string" ? new Error(error) : error;
      setError(errorObj);

      // Get user-friendly error
      const userError = getUserFriendlyError(errorObj, context || options.context);

      // Report to Sentry
      trackError(errorObj, context);

      // Show toast if enabled
      if (options.showToast !== false) {
        showErrorToast(errorObj, context, toast);
      }

      return userError;
    },
    [options, trackError],
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Retry failed operation
  const retryOperation = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T | null> => {
      setIsRetrying(true);
      clearError();

      try {
        const result = options.fallback
          ? await retryWithFallback(operation, options.fallback, options.retryOptions)
          : await retry(operation, options.retryOptions);

        setIsRetrying(false);
        return result;
      } catch (err) {
        setIsRetrying(false);
        handleError(err as Error);
        return null;
      }
    },
    [options, clearError, handleError],
  );

  // Create wrapped fetch with retry
  const fetchWithRetry = useCallback(createRetryFetch(options.retryOptions), [options.retryOptions]);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retryOperation,
    fetchWithRetry,
    addBreadcrumb: addCrumb,
  };
}

/**
 * Hook for async operations with error handling
 */
export function useAsyncOperation<T = any>(operation: () => Promise<T>, options: UseErrorHandlingOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError, retryOperation } = useErrorHandling(options);

  const execute = useCallback(async () => {
    setLoading(true);
    clearError();

    try {
      const result = await retryOperation(operation);
      if (result !== null) {
        setData(result);
      }
    } finally {
      setLoading(false);
    }
  }, [operation, clearError, retryOperation]);

  const reset = useCallback(() => {
    setData(null);
    clearError();
    setLoading(false);
  }, [clearError]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    retry: execute,
  };
}

/**
 * Hook for form submission with error handling
 */
export function useFormSubmit<T = any>(onSubmit: (data: T) => Promise<void>, options: UseErrorHandlingOptions = {}) {
  const [submitting, setSubmitting] = useState(false);
  const { error, handleError, clearError } = useErrorHandling(options);

  const submit = useCallback(
    async (data: T) => {
      setSubmitting(true);
      clearError();

      try {
        await retry(() => onSubmit(data), {
          maxAttempts: 2,
          ...options.retryOptions,
        });

        toast.success("Submitted successfully!");
      } catch (err) {
        handleError(err as Error, { action: "form_submit" });
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit, options.retryOptions, clearError, handleError],
  );

  return {
    submit,
    submitting,
    error,
    clearError,
  };
}

/**
 * Hook for data fetching with caching and error handling
 */
export function useFetch<T = any>(url: string, options: RequestInit & UseErrorHandlingOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const { error, handleError, clearError, fetchWithRetry } = useErrorHandling(options);

  const fetchData = useCallback(async () => {
    setLoading(true);
    clearError();

    try {
      addBreadcrumb({
        message: `Fetching data from ${url}`,
        category: "fetch",
        level: "info",
      });

      const response = await fetchWithRetry(url, options);
      const result = await response.json();
      setData(result);
    } catch (err) {
      handleError(err as Error, { action: "fetch", field: url });
    } finally {
      setLoading(false);
    }
  }, [url, options, clearError, fetchWithRetry, handleError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for WebSocket with reconnection and error handling
 */
export function useWebSocket(
  url: string,
  options: {
    onMessage?: (data: any) => void;
    onError?: (error: Error) => void;
    reconnect?: boolean;
    reconnectDelay?: number;
  } = {},
) {
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { handleError } = useErrorHandling({ showToast: true });

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        socket = new WebSocket(url);

        socket.onopen = () => {
          setConnected(true);
          addBreadcrumb({
            message: `WebSocket connected to ${url}`,
            category: "websocket",
            level: "info",
          });
        };

        socket.onmessage = event => {
          try {
            const data = JSON.parse(event.data);
            options.onMessage?.(data);
          } catch (err) {
            handleError(err as Error, { action: "websocket_message" });
          }
        };

        socket.onerror = event => {
          const error = new Error("WebSocket error");
          handleError(error, { action: "websocket_error" });
          options.onError?.(error);
        };

        socket.onclose = () => {
          setConnected(false);

          if (options.reconnect !== false) {
            reconnectTimeout = setTimeout(connect, options.reconnectDelay || 5000);
          }
        };

        setWs(socket);
      } catch (err) {
        handleError(err as Error, { action: "websocket_connect" });
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      socket?.close();
    };
  }, [url, options, handleError]);

  const send = useCallback(
    (data: any) => {
      if (ws?.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(data));
        } catch (err) {
          handleError(err as Error, { action: "websocket_send" });
        }
      } else {
        handleError(new Error("WebSocket not connected"), { action: "websocket_send" });
      }
    },
    [ws, handleError],
  );

  return {
    connected,
    send,
    ws,
  };
}

/**
 * Example usage in a component
 */
export function ExampleComponent() {
  // Basic error handling
  const { handleError, clearError } = useErrorHandling({
    showToast: true,
    context: { component: "ExampleComponent" },
  });

  // Async operation with retry
  const { data, loading, error, execute } = useAsyncOperation(
    async () => {
      const response = await fetch("/api/data");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
    {
      retryOptions: { maxAttempts: 3 },
      fallback: { defaultData: true },
    },
  );

  // Form submission
  const { submit, submitting } = useFormSubmit(async formData => {
    const response = await fetch("/api/submit", {
      method: "POST",
      body: JSON.stringify(formData),
    });
    if (!response.ok) throw new Error("Submission failed");
  });

  // Data fetching
  const { data: fetchedData, loading: fetching, refetch } = useFetch("/api/resource");

  // WebSocket connection
  const { connected, send } = useWebSocket("ws://localhost:3000", {
    onMessage: data => console.log("Received:", data),
    reconnect: true,
  });

  return null; // Component implementation
}
