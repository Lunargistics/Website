import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "~~/lib/rate-limit";

interface ErrorReport {
  id?: string;
  timestamp: string;
  component: string;
  message: string;
  stack?: string;
  componentStack?: string;
  userAgent: string;
  url: string;
  retryCount: number;
  context?: {
    hasWebGL: boolean;
    hasWorldWind: boolean;
    hasCesium: boolean;
    memoryUsage?: {
      used: number;
      total: number;
      limit: number;
    };
  };
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, "api", async () => {
    try {
      const errorReport: ErrorReport = await request.json();

      // Validate error report
      if (!errorReport.message || !errorReport.timestamp || !errorReport.component) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      // Log error for development
      if (process.env.NODE_ENV === "development") {
        console.error("Frontend Error Report:", {
          component: errorReport.component,
          message: errorReport.message,
          timestamp: errorReport.timestamp,
          context: errorReport.context,
        });
      }

      // In production, send to monitoring service
      if (process.env.NODE_ENV === "production") {
        // Send to external error tracking service
        await sendToErrorService(errorReport);
      }

      // Store in database or logging service
      await logError(errorReport);

      return NextResponse.json({
        success: true,
        message: "Error report received",
      });
    } catch (error) {
      console.error("Error handling error report:", error);
      return NextResponse.json({ error: "Failed to process error report" }, { status: 500 });
    }
  });
}

async function sendToErrorService(errorReport: ErrorReport): Promise<void> {
  // Integrate with Sentry, DataDog, or other error tracking service
  if (process.env.SENTRY_DSN) {
    try {
      // Sentry integration would go here
      console.log("Would send to Sentry:", errorReport);
    } catch (error) {
      console.error("Failed to send to Sentry:", error);
    }
  }
}

async function logError(errorReport: ErrorReport): Promise<void> {
  // Log to file system or database
  const logEntry = {
    ...errorReport,
    severity: getSeverity(errorReport.message),
    category: categorizeError(errorReport.message, errorReport.component),
  };

  // In a real application, you'd save to database or structured logging
  console.log("Error Log Entry:", logEntry);
}

function getSeverity(message: string): "low" | "medium" | "high" | "critical" {
  const criticalPatterns = ["ChunkLoadError", "NetworkError", "WebGL"];
  const highPatterns = ["TypeError", "ReferenceError", "Contract error"];
  const mediumPatterns = ["TimeoutError", "Invalid TLE", "404"];

  if (criticalPatterns.some(pattern => message.includes(pattern))) return "critical";
  if (highPatterns.some(pattern => message.includes(pattern))) return "high";
  if (mediumPatterns.some(pattern => message.includes(pattern))) return "medium";
  return "low";
}

function categorizeError(message: string, component: string): string {
  if (component.includes("WorldWind") || component.includes("3D")) return "visualization";
  if (message.includes("Contract") || message.includes("blockchain")) return "web3";
  if (message.includes("Network") || message.includes("fetch")) return "network";
  if (message.includes("TLE") || message.includes("orbital")) return "orbital-mechanics";
  return "general";
}
