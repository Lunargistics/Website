/**
 * User-Friendly Error Message System
 * Provides human-readable error messages and helpful recovery suggestions
 */

export interface ErrorContext {
  code?: string;
  statusCode?: number;
  component?: string;
  action?: string;
  field?: string;
  value?: any;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  suggestion?: string;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  severity: "info" | "warning" | "error" | "critical";
  technical?: string;
}

/**
 * Error message mappings
 */
const errorMappings: Record<string, (context?: ErrorContext) => UserFriendlyError> = {
  // Network Errors
  NetworkError: () => ({
    title: "Connection Problem",
    message: "We're having trouble connecting to our servers.",
    suggestion: "Please check your internet connection and try again.",
    severity: "error",
  }),

  TimeoutError: () => ({
    title: "Request Timed Out",
    message: "The operation took too long to complete.",
    suggestion: "This might be due to a slow connection. Please try again.",
    severity: "warning",
  }),

  // Authentication Errors
  AuthenticationError: () => ({
    title: "Authentication Required",
    message: "Please sign in to continue.",
    suggestion: "Your session may have expired. Please sign in again.",
    severity: "warning",
  }),

  UnauthorizedError: () => ({
    title: "Access Denied",
    message: "You don't have permission to perform this action.",
    suggestion: "Contact your administrator if you believe this is an error.",
    severity: "error",
  }),

  // Validation Errors
  ValidationError: (context) => ({
    title: "Invalid Input",
    message: context?.field 
      ? `The ${context.field} field contains invalid data.`
      : "Please check your input and try again.",
    suggestion: "Make sure all required fields are filled correctly.",
    severity: "warning",
  }),

  RequiredFieldError: (context) => ({
    title: "Required Field Missing",
    message: `${context?.field || "A required field"} cannot be empty.`,
    suggestion: "Please fill in all required fields marked with an asterisk (*).",
    severity: "warning",
  }),

  // Data Errors
  NotFoundError: (context) => ({
    title: "Not Found",
    message: `The ${context?.component || "item"} you're looking for doesn't exist.`,
    suggestion: "It may have been moved or deleted. Try searching or go back to the dashboard.",
    severity: "warning",
  }),

  DataFetchError: () => ({
    title: "Failed to Load Data",
    message: "We couldn't retrieve the information you requested.",
    suggestion: "This is usually temporary. Please refresh the page or try again later.",
    severity: "error",
  }),

  // Storage Errors
  StorageQuotaError: () => ({
    title: "Storage Full",
    message: "Your browser's storage is full.",
    suggestion: "Clear your browser cache or remove unnecessary data to free up space.",
    severity: "warning",
  }),

  LocalStorageError: () => ({
    title: "Storage Access Denied",
    message: "Cannot access browser storage.",
    suggestion: "Check your browser settings and ensure cookies and local storage are enabled.",
    severity: "error",
  }),

  // File Errors
  FileUploadError: (context) => ({
    title: "Upload Failed",
    message: `Failed to upload ${context?.field || "file"}.`,
    suggestion: "Check the file size and format, then try again.",
    severity: "error",
  }),

  FileSizeError: () => ({
    title: "File Too Large",
    message: "The file exceeds the maximum allowed size.",
    suggestion: "Please choose a smaller file (max 10MB).",
    severity: "warning",
  }),

  FileTypeError: () => ({
    title: "Invalid File Type",
    message: "This file type is not supported.",
    suggestion: "Please upload files in supported formats (PDF, JPG, PNG, etc.).",
    severity: "warning",
  }),

  // Blockchain Errors
  TransactionError: () => ({
    title: "Transaction Failed",
    message: "The blockchain transaction could not be completed.",
    suggestion: "Check your wallet balance and gas fees, then try again.",
    severity: "error",
  }),

  ContractError: () => ({
    title: "Smart Contract Error",
    message: "Failed to interact with the smart contract.",
    suggestion: "This might be a temporary issue. Please try again later.",
    severity: "error",
  }),

  WalletConnectionError: () => ({
    title: "Wallet Connection Failed",
    message: "Could not connect to your wallet.",
    suggestion: "Make sure your wallet is unlocked and try connecting again.",
    severity: "error",
  }),

  // API Errors
  RateLimitError: () => ({
    title: "Too Many Requests",
    message: "You've made too many requests in a short time.",
    suggestion: "Please wait a moment before trying again.",
    severity: "warning",
  }),

  ServerError: () => ({
    title: "Server Error",
    message: "Something went wrong on our end.",
    suggestion: "Our team has been notified. Please try again later.",
    severity: "critical",
  }),

  MaintenanceError: () => ({
    title: "Under Maintenance",
    message: "This service is temporarily unavailable for maintenance.",
    suggestion: "We'll be back shortly. Please check back in a few minutes.",
    severity: "info",
  }),

  // Application Errors
  FeatureUnavailable: (context) => ({
    title: "Feature Unavailable",
    message: `${context?.component || "This feature"} is not available right now.`,
    suggestion: "Some features may be limited in your current plan or region.",
    severity: "info",
  }),

  ConfigurationError: () => ({
    title: "Configuration Error",
    message: "The application is not configured correctly.",
    suggestion: "Please contact support for assistance.",
    severity: "critical",
  }),

  CompatibilityError: () => ({
    title: "Compatibility Issue",
    message: "Your browser may not support all features.",
    suggestion: "For the best experience, please use a modern browser like Chrome, Firefox, or Edge.",
    severity: "warning",
  }),
};

/**
 * HTTP status code to error mapping
 */
const statusCodeMappings: Record<number, string> = {
  400: "ValidationError",
  401: "AuthenticationError",
  403: "UnauthorizedError",
  404: "NotFoundError",
  408: "TimeoutError",
  413: "FileSizeError",
  429: "RateLimitError",
  500: "ServerError",
  502: "ServerError",
  503: "MaintenanceError",
  504: "TimeoutError",
};

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(
  error: Error | string,
  context?: ErrorContext
): UserFriendlyError {
  // Handle string errors
  if (typeof error === "string") {
    error = new Error(error);
  }

  // Check for status code mapping
  if (context?.statusCode && statusCodeMappings[context.statusCode]) {
    const errorType = statusCodeMappings[context.statusCode];
    if (errorMappings[errorType]) {
      return errorMappings[errorType](context);
    }
  }

  // Check for error code mapping
  if (context?.code && errorMappings[context.code]) {
    return errorMappings[context.code](context);
  }

  // Check error name
  if (error.name && errorMappings[error.name]) {
    return errorMappings[error.name](context);
  }

  // Check error message for patterns
  const errorMessage = error.message.toLowerCase();
  
  // Network-related patterns
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return errorMappings.NetworkError(context);
  }
  
  if (errorMessage.includes("timeout")) {
    return errorMappings.TimeoutError(context);
  }
  
  // Auth-related patterns
  if (errorMessage.includes("unauthorized") || errorMessage.includes("401")) {
    return errorMappings.AuthenticationError(context);
  }
  
  if (errorMessage.includes("forbidden") || errorMessage.includes("403")) {
    return errorMappings.UnauthorizedError(context);
  }
  
  // Data-related patterns
  if (errorMessage.includes("not found") || errorMessage.includes("404")) {
    return errorMappings.NotFoundError(context);
  }
  
  // Storage-related patterns
  if (errorMessage.includes("quota") || errorMessage.includes("storage")) {
    return errorMappings.StorageQuotaError(context);
  }
  
  // Default error
  return {
    title: "Something Went Wrong",
    message: "An unexpected error occurred.",
    suggestion: "Please try again. If the problem persists, contact support.",
    severity: "error",
    technical: process.env.NODE_ENV === "development" ? error.message : undefined,
  };
}

/**
 * Format error for display
 */
export function formatErrorForDisplay(error: UserFriendlyError): string {
  let formatted = `${error.title}: ${error.message}`;
  
  if (error.suggestion) {
    formatted += ` ${error.suggestion}`;
  }
  
  return formatted;
}

/**
 * Error recovery suggestions
 */
export const recoveryActions = {
  refresh: {
    label: "Refresh Page",
    action: () => window.location.reload(),
  },
  goHome: {
    label: "Go to Dashboard",
    action: () => window.location.href = "/",
  },
  goBack: {
    label: "Go Back",
    action: () => window.history.back(),
  },
  retry: (fn: () => void) => ({
    label: "Try Again",
    action: fn,
  }),
  signIn: {
    label: "Sign In",
    action: () => window.location.href = "/login",
  },
  clearCache: {
    label: "Clear Cache",
    action: () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    },
  },
  contactSupport: {
    label: "Contact Support",
    action: () => window.open("/support", "_blank"),
  },
};

/**
 * Error toast notification helper
 */
export function showErrorToast(
  error: Error | string,
  context?: ErrorContext,
  toast?: any // React hot toast instance
) {
  const userError = getUserFriendlyError(error, context);
  
  if (!toast) {
    console.error(userError);
    return;
  }
  
  const toastOptions = {
    duration: userError.severity === "critical" ? 8000 : 5000,
    icon: userError.severity === "info" ? "ℹ️" : 
          userError.severity === "warning" ? "⚠️" : 
          userError.severity === "critical" ? "🚨" : "❌",
  };
  
  toast.error(
    <div>
      <strong>{userError.title}</strong>
      <p className="text-sm mt-1">{userError.message}</p>
      {userError.suggestion && (
        <p className="text-xs mt-2 opacity-90">{userError.suggestion}</p>
      )}
    </div>,
    toastOptions
  );
}

/**
 * Error logger for development
 */
export function logError(
  error: Error,
  context?: ErrorContext,
  additionalData?: any
) {
  if (process.env.NODE_ENV === "development") {
    console.group(`🔴 Error: ${error.name || "Unknown"}`);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    if (context) console.log("Context:", context);
    if (additionalData) console.log("Additional Data:", additionalData);
    console.groupEnd();
  }
  
  // In production, this would send to error tracking service
  // sendToErrorTracking(error, context, additionalData);
}