"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
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
}

/**
 * Comprehensive Error Boundary Component
 * Provides graceful error handling with retry logic and detailed error reporting
 */
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      showDetails: false,
    };
    
    if (props.resetKeys) {
      this.previousResetKeys = props.resetKeys;
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
      showDetails: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
    }

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (will be implemented with Sentry)
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset on prop changes if enabled
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    // Reset when resetKeys change
    if (
      hasError &&
      resetKeys &&
      this.previousResetKeys.some((key, idx) => key !== resetKeys[idx])
    ) {
      this.resetErrorBoundary();
      this.previousResetKeys = resetKeys;
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      showDetails: false,
    });
  };

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // This will be replaced with actual Sentry reporting
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      level: this.props.level || "component",
    };

    // For now, store in localStorage for debugging
    const errors = JSON.parse(localStorage.getItem("error_reports") || "[]");
    errors.push(errorReport);
    if (errors.length > 50) {
      errors.shift(); // Keep only last 50 errors
    }
    localStorage.setItem("error_reports", JSON.stringify(errors));
  };

  handleRetry = () => {
    // Implement exponential backoff for retries
    const { errorCount } = this.state;
    const delay = Math.min(1000 * Math.pow(2, errorCount - 1), 10000);

    this.setState({ hasError: false, error: null, errorInfo: null });

    if (errorCount < 3) {
      this.resetTimeoutId = window.setTimeout(() => {
        this.resetErrorBoundary();
      }, delay);
    }
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    const { hasError, error, errorInfo, errorCount, showDetails } = this.state;
    const { children, fallback, isolate, level } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Determine error boundary level styling
      const levelStyles = {
        page: "min-h-screen",
        section: "min-h-[400px]",
        component: "min-h-[200px]",
      };

      const containerClass = `flex items-center justify-center ${levelStyles[level || "component"]} ${
        isolate ? "relative" : ""
      }`;

      return (
        <div className={containerClass}>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                  {level === "page" 
                    ? "Page Error"
                    : level === "section"
                    ? "Section Error"
                    : "Something went wrong"}
                </h3>
                
                <p className="text-red-700 dark:text-red-300 mb-4">
                  {this.getErrorMessage(error)}
                </p>

                {/* Error details toggle */}
                {process.env.NODE_ENV === "development" && (
                  <button
                    onClick={this.toggleDetails}
                    className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 mb-4"
                  >
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showDetails ? "Hide" : "Show"} error details
                  </button>
                )}

                {/* Error details */}
                {showDetails && errorInfo && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 mb-4 overflow-auto max-h-64">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      <strong>Error Stack:</strong>
                      {"\n"}
                      {error.stack}
                      {"\n\n"}
                      <strong>Component Stack:</strong>
                      {"\n"}
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                {/* Retry information */}
                {errorCount > 1 && (
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    Failed {errorCount} times. {errorCount >= 3 ? "Maximum retries reached." : "Retrying..."}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  {errorCount < 3 && (
                    <button
                      onClick={this.handleRetry}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>
                  )}
                  
                  {level === "page" && (
                    <button
                      onClick={() => window.location.href = "/"}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      Go Home
                    </button>
                  )}
                  
                  {level !== "page" && (
                    <button
                      onClick={() => window.location.reload()}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reload Page
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }

  private getErrorMessage(error: Error): string {
    // User-friendly error messages
    const errorMessages: Record<string, string> = {
      "ChunkLoadError": "Failed to load application resources. Please refresh the page.",
      "NetworkError": "Network connection issue. Please check your internet connection.",
      "TypeError": "An unexpected error occurred. Our team has been notified.",
      "ReferenceError": "Application error. Please try refreshing the page.",
      "SyntaxError": "Application loading error. Please clear your cache and try again.",
    };

    // Check for known error types
    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.name.includes(key) || error.message.includes(key)) {
        return message;
      }
    }

    // Check for specific error patterns
    if (error.message.includes("fetch")) {
      return "Failed to load data. Please check your connection and try again.";
    }

    if (error.message.includes("localStorage")) {
      return "Storage error. Please clear your browser data and try again.";
    }

    if (error.message.includes("permission")) {
      return "Permission denied. Please check your browser settings.";
    }

    // Default message
    return process.env.NODE_ENV === "development"
      ? error.message
      : "An unexpected error occurred. Please try again later.";
  }
}

/**
 * Error boundary provider for wrapping entire app
 */
export function ErrorBoundaryProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      level="page"
      onError={(error, errorInfo) => {
        // Global error handler
        console.error("Global error:", error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Hook for using error boundary in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    throwError: setError,
    clearError: () => setError(null),
  };
}