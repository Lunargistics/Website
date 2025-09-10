"use client";

import React from "react";
import { 
  AlertCircle, 
  WifiOff, 
  CloudOff, 
  ServerCrash,
  RefreshCw,
  ArrowLeft,
  Loader2,
  FileX,
  Database,
  ShieldAlert
} from "lucide-react";

interface FallbackProps {
  error?: Error;
  retry?: () => void;
  goBack?: () => void;
  message?: string;
}

/**
 * Network Error Fallback
 */
export function NetworkErrorFallback({ retry, message }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <WifiOff className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Connection Problem
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {message || "Unable to connect to our servers. Please check your internet connection and try again."}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Service Unavailable Fallback
 */
export function ServiceUnavailableFallback({ retry, message }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <ServerCrash className="w-16 h-16 text-orange-500 dark:text-orange-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Service Temporarily Unavailable
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {message || "Our service is currently undergoing maintenance. Please try again in a few minutes."}
      </p>
      <div className="flex gap-3">
        {retry && (
          <button
            onClick={retry}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
        <button
          onClick={() => window.location.href = "/"}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

/**
 * Data Loading Error Fallback
 */
export function DataErrorFallback({ retry, message }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <Database className="w-12 h-12 text-red-500 dark:text-red-400 mb-3" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Failed to Load Data
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
        {message || "We couldn't load the requested data. This might be temporary."}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      )}
    </div>
  );
}

/**
 * Permission Denied Fallback
 */
export function PermissionDeniedFallback({ goBack, message }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <ShieldAlert className="w-16 h-16 text-red-500 dark:text-red-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Access Denied
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {message || "You don't have permission to access this resource. Please contact your administrator if you believe this is an error."}
      </p>
      <div className="flex gap-3">
        {goBack && (
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        )}
        <button
          onClick={() => window.location.href = "/"}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

/**
 * File Not Found Fallback
 */
export function FileNotFoundFallback({ retry, goBack, message }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
      <FileX className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        File Not Found
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
        {message || "The requested file could not be found."}
      </p>
      <div className="flex gap-3">
        {retry && (
          <button
            onClick={retry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-3 h-3" />
            Try Again
          </button>
        )}
        {goBack && (
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors text-sm"
          >
            <ArrowLeft className="w-3 h-3" />
            Go Back
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Generic Error Fallback
 */
export function ErrorFallback({ error, retry, goBack, message }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
      <AlertCircle className="w-12 h-12 text-yellow-500 dark:text-yellow-400 mb-3" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Something Went Wrong
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
        {message || error?.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex gap-3">
        {retry && (
          <button
            onClick={retry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-3 h-3" />
            Try Again
          </button>
        )}
        {goBack && (
          <button
            onClick={goBack}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors text-sm"
          >
            Go Back
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Loading State Fallback
 */
export function LoadingFallback({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
      <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mb-3" />
      <p className="text-gray-600 dark:text-gray-400 text-center">
        {message || "Loading..."}
      </p>
    </div>
  );
}

/**
 * Skeleton Loading Components
 */
export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        <div className="h-12 bg-gray-300 dark:bg-gray-600"></div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-t border-gray-300 dark:border-gray-600">
            <div className="h-10 bg-gray-200 dark:bg-gray-700"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Degraded Feature Component
 */
export function DegradedFeature({ 
  feature, 
  reason,
  alternative 
}: { 
  feature: string; 
  reason?: string;
  alternative?: string;
}) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <div>
          <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
            Limited Functionality
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {feature} is currently operating with reduced capabilities
            {reason && ` due to ${reason}`}.
            {alternative && ` ${alternative}`}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Offline Indicator
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = React.useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-lg p-4 flex items-center gap-3">
        <CloudOff className="w-5 h-5" />
        <div>
          <p className="font-medium">You're offline</p>
          <p className="text-sm text-gray-300">Some features may be limited</p>
        </div>
      </div>
    </div>
  );
}