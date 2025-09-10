"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Home, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: "page" | "section" | "component";
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  showDetails: boolean;
  isRecovering: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      showDetails: false,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    // Report to error tracking service
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // Auto-retry for transient errors
    if (this.shouldAutoRetry(error)) {
      this.scheduleRetry();
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      // Reset on prop changes if specified
      if (resetOnPropsChange && prevProps.children !== this.props.children) {
        this.resetErrorBoundary();
      }

      // Reset on key changes
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    // Auto-retry network errors and certain known transient errors
    const transientErrors = [
      "NetworkError",
      "TimeoutError",
      "ChunkLoadError",
      "Loading chunk",
      "Failed to fetch",
      "Load failed",
    ];

    return (
      this.retryCount < this.MAX_RETRIES &&
      transientErrors.some(msg => error.message?.includes(msg) || error.name?.includes(msg))
    );
  }

  private scheduleRetry = () => {
    this.setState({ isRecovering: true });

    this.resetTimeoutId = setTimeout(
      () => {
        this.retryCount++;
        this.resetErrorBoundary();
      },
      this.RETRY_DELAY * Math.pow(2, this.retryCount),
    ); // Exponential backoff
  };

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Report to error tracking service (Sentry integration)
      if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
          tags: {
            level: this.props.level || "component",
            errorBoundary: true,
          },
        });
      }

      // Also send to our API for logging
      await fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          level: this.props.level,
        }),
      }).catch(console.error);
    } catch (reportingError) {
      console.error("Failed to report error:", reportingError);
    }
  };

  private resetErrorBoundary = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      isRecovering: false,
    });
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  private getErrorMessage(): string {
    const { error } = this.state;

    if (!error) return "An unexpected error occurred";

    // User-friendly error messages
    const errorMessages: Record<string, string> = {
      ChunkLoadError: "Failed to load application resources. Please refresh the page.",
      NetworkError: "Network connection issue. Please check your internet connection.",
      TimeoutError: "The request took too long. Please try again.",
      "Permission denied": "You don't have permission to access this resource.",
      "404": "The requested resource was not found.",
      "500": "Server error. Our team has been notified.",
      "Invalid TLE": "Invalid satellite data format. Please check your input.",
      "Contract error": "Blockchain transaction failed. Please try again.",
    };

    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.message?.includes(key) || error.name?.includes(key)) {
        return message;
      }
    }

    return "Something went wrong. Please try again or contact support if the issue persists.";
  }

  private renderErrorUI() {
    const { error, errorInfo, showDetails, isRecovering, errorCount } = this.state;
    const { level = "component", fallback } = this.props;

    if (fallback) {
      return <>{fallback}</>;
    }

    const isPageLevel = level === "page";
    const isSectionLevel = level === "section";

    return (
      <div
        className={`
        flex flex-col items-center justify-center
        ${isPageLevel ? "min-h-screen" : isSectionLevel ? "min-h-[400px]" : "min-h-[200px]"}
        bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950
        p-8 rounded-lg
      `}
      >
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {isRecovering ? "Recovering..." : "Oops! Something went wrong"}
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">{this.getErrorMessage()}</p>

            {errorCount > 1 && (
              <div className="mb-4 text-sm text-orange-600 dark:text-orange-400">
                This error has occurred {errorCount} times
              </div>
            )}

            {isRecovering && (
              <div className="mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Attempting to recover... (Retry {this.retryCount + 1}/{this.MAX_RETRIES})
                </p>
              </div>
            )}

            {!isRecovering && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.resetErrorBoundary}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>

                {isPageLevel && (
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </button>
                )}
              </div>
            )}

            {/* Error details (development mode) */}
            {process.env.NODE_ENV === "development" && error && (
              <div className="mt-6">
                <button
                  onClick={this.toggleDetails}
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showDetails ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                  {showDetails ? "Hide" : "Show"} Error Details
                </button>

                {showDetails && (
                  <div className="mt-4 text-left">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-auto max-h-64">
                      <p className="text-xs font-mono text-red-600 dark:text-red-400 mb-2">{error.toString()}</p>
                      {error.stack && (
                        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">{error.stack}</pre>
                      )}
                      {errorInfo?.componentStack && (
                        <details className="mt-4">
                          <summary className="text-xs text-gray-500 cursor-pointer">Component Stack</summary>
                          <pre className="text-xs text-gray-600 dark:text-gray-400 mt-2 overflow-x-auto">
                            {errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

// Async Error Boundary for Suspense boundaries
export function AsyncErrorBoundary({ children, fallback, ...props }: Props) {
  return (
    <ErrorBoundary {...props}>
      <React.Suspense
        fallback={
          fallback || (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          )
        }
      >
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(Component: React.ComponentType<P>, errorBoundaryProps?: Props) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ErrorBoundary;
