/**
 * Sentry Error Reporting Configuration
 * Provides comprehensive error tracking and monitoring
 */
import { ErrorInfo } from "react";

// Sentry configuration (will be replaced with actual Sentry SDK)
interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  tracesSampleRate: number;
  beforeSend?: (event: any) => any;
}

interface ErrorReport {
  error: Error;
  errorInfo?: ErrorInfo;
  context?: Record<string, any>;
  level: "debug" | "info" | "warning" | "error" | "fatal";
  tags?: Record<string, string>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  extra?: Record<string, any>;
}

/**
 * Initialize Sentry
 * In production, this would use @sentry/nextjs
 */
export function initSentry(): void {
  const config: SentryConfig = {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
    environment: process.env.NODE_ENV || "development",
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate: 0.1,
    beforeSend: event => {
      // Filter out sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      if (event.user?.email) {
        event.user.email = "***";
      }
      return event;
    },
  };

  if (config.enabled && config.dsn) {
    console.log("Sentry initialized with DSN:", config.dsn.substring(0, 20) + "...");

    // In production, initialize Sentry here:
    // Sentry.init(config);

    // Set up global error handlers
    setupGlobalErrorHandlers();
  } else {
    console.log("Sentry disabled in development mode");
    setupDevelopmentErrorHandlers();
  }
}

/**
 * Report error to Sentry
 */
export function reportError(report: ErrorReport): void {
  // In production, this would use Sentry SDK
  // Sentry.captureException(report.error, {
  //   level: report.level,
  //   tags: report.tags,
  //   user: report.user,
  //   extra: report.extra,
  //   contexts: {
  //     react: report.errorInfo,
  //     custom: report.context,
  //   },
  // });

  // For now, log to console and store locally
  const errorLog = {
    timestamp: new Date().toISOString(),
    ...report,
    errorMessage: report.error.message,
    errorStack: report.error.stack,
  };

  if (process.env.NODE_ENV === "development") {
    console.group(`🚨 Error Report (Level: ${report.level})`);
    console.error("Error:", report.error);
    if (report.errorInfo) console.log("Error Info:", report.errorInfo);
    if (report.context) console.log("Context:", report.context);
    if (report.tags) console.log("Tags:", report.tags);
    if (report.extra) console.log("Extra:", report.extra);
    console.groupEnd();
  }

  // Store in local storage for debugging
  storeErrorLocally(errorLog);
}

/**
 * Report warning to Sentry
 */
export function reportWarning(message: string, context?: Record<string, any>): void {
  const warning = new Error(message);
  reportError({
    error: warning,
    level: "warning",
    context,
  });
}

/**
 * Report info to Sentry
 */
export function reportInfo(message: string, context?: Record<string, any>): void {
  // In production: Sentry.captureMessage(message, "info");
  console.info("Info:", message, context);
}

/**
 * Set user context for Sentry
 */
export function setUserContext(user: { id?: string; email?: string; username?: string }): void {
  // In production: Sentry.setUser(user);
  console.log("User context set:", user);
}

/**
 * Add breadcrumb for better error context
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: "debug" | "info" | "warning" | "error";
  data?: Record<string, any>;
}): void {
  // In production: Sentry.addBreadcrumb(breadcrumb);
  if (process.env.NODE_ENV === "development") {
    console.log("Breadcrumb:", breadcrumb);
  }
}

/**
 * Create error boundary error handler
 */
export function createErrorBoundaryHandler() {
  return (error: Error, errorInfo: ErrorInfo) => {
    reportError({
      error,
      errorInfo,
      level: "error",
      tags: {
        source: "error_boundary",
      },
      context: {
        componentStack: errorInfo.componentStack,
      },
    });
  };
}

/**
 * Setup global error handlers
 */
function setupGlobalErrorHandlers(): void {
  // Unhandled promise rejections
  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", event => {
      reportError({
        error: new Error(event.reason?.message || "Unhandled Promise Rejection"),
        level: "error",
        tags: {
          source: "unhandledrejection",
        },
        extra: {
          reason: event.reason,
          promise: event.promise,
        },
      });
    });

    // Global error handler
    window.addEventListener("error", event => {
      reportError({
        error: event.error || new Error(event.message),
        level: "error",
        tags: {
          source: "window_error",
        },
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });
  }
}

/**
 * Setup development error handlers
 */
function setupDevelopmentErrorHandlers(): void {
  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", event => {
      console.error("Unhandled Promise Rejection:", event.reason);
    });

    window.addEventListener("error", event => {
      console.error("Global Error:", event.error || event.message);
    });
  }
}

/**
 * Store error locally for debugging
 */
function storeErrorLocally(error: any): void {
  try {
    const errors = JSON.parse(localStorage.getItem("error_logs") || "[]");
    errors.push(error);

    // Keep only last 100 errors
    if (errors.length > 100) {
      errors.shift();
    }

    localStorage.setItem("error_logs", JSON.stringify(errors));
  } catch (e) {
    // Ignore storage errors
    console.warn("Failed to store error locally:", e);
  }
}

/**
 * Get stored errors
 */
export function getStoredErrors(): any[] {
  try {
    return JSON.parse(localStorage.getItem("error_logs") || "[]");
  } catch {
    return [];
  }
}

/**
 * Clear stored errors
 */
export function clearStoredErrors(): void {
  localStorage.removeItem("error_logs");
}

/**
 * Performance monitoring
 */
export function startTransaction(name: string, op: string): any {
  // In production: return Sentry.startTransaction({ name, op });
  const startTime = performance.now();
  return {
    finish: () => {
      const duration = performance.now() - startTime;
      console.log(`Transaction "${name}" (${op}) took ${duration.toFixed(2)}ms`);
    },
  };
}

/**
 * Custom error class for better tracking
 */
export class TrackedError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly context?: Record<string, any>;

  constructor(message: string, code: string, statusCode?: number, context?: Record<string, any>) {
    super(message);
    this.name = "TrackedError";
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;

    // Automatically report to Sentry
    reportError({
      error: this,
      level: "error",
      tags: {
        error_code: code,
        status_code: statusCode?.toString() || "",
      },
      context,
    });
  }
}

/**
 * Wrap async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(fn: T, context?: Record<string, any>): T {
  return (async (...args: Parameters<T>) => {
    const transaction = startTransaction(fn.name || "anonymous", "function");

    try {
      addBreadcrumb({
        message: `Calling ${fn.name || "anonymous function"}`,
        category: "function",
        level: "info",
        data: { args: args.slice(0, 3) }, // Limit args for privacy
      });

      const result = await fn(...args);
      transaction.finish();
      return result;
    } catch (error) {
      reportError({
        error: error as Error,
        level: "error",
        context: {
          ...context,
          functionName: fn.name,
          arguments: args.slice(0, 3),
        },
      });
      transaction.finish();
      throw error;
    }
  }) as T;
}

/**
 * React Hook for error tracking
 */
export function useErrorTracking() {
  return {
    reportError: (error: Error, context?: Record<string, any>) => {
      reportError({
        error,
        level: "error",
        context,
        tags: {
          source: "react_hook",
        },
      });
    },
    reportWarning,
    reportInfo,
    addBreadcrumb,
  };
}
