import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";

// Error log structure
interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  level?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// In-memory store for development (replace with database in production)
const errorLogs: ErrorLog[] = [];
const MAX_ERROR_LOGS = 1000;

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 errors per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // Get session for user context
    const session = await getServerSession(authOptions);

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.message) {
      return NextResponse.json({ error: "Error message is required" }, { status: 400 });
    }

    // Create error log entry
    const errorLog: ErrorLog = {
      id: generateErrorId(),
      message: sanitizeInput(body.message),
      stack: body.stack ? sanitizeInput(body.stack) : undefined,
      componentStack: body.componentStack ? sanitizeInput(body.componentStack) : undefined,
      timestamp: body.timestamp || new Date().toISOString(),
      userAgent: body.userAgent ? sanitizeInput(body.userAgent) : undefined,
      url: body.url ? sanitizeInput(body.url) : undefined,
      level: body.level || "error",
      userId: session?.user?.id,
      sessionId: request.headers.get("x-session-id") || undefined,
      metadata: body.metadata,
    };

    // Store error log
    await storeErrorLog(errorLog);

    // Send alerts for critical errors
    if (errorLog.level === "critical" || errorLog.message.includes("Critical")) {
      await sendErrorAlert(errorLog);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Client Error:", errorLog);
    }

    return NextResponse.json({
      success: true,
      errorId: errorLog.id,
      message: "Error logged successfully",
    });
  } catch (error) {
    console.error("Failed to log error:", error);
    return NextResponse.json({ error: "Failed to log error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    // Only allow authenticated users to view error logs
    // TODO: Implement role-based access control
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const level = searchParams.get("level");
    const userId = searchParams.get("userId");
    const since = searchParams.get("since");

    // Filter error logs
    let filtered = [...errorLogs];

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    if (userId) {
      filtered = filtered.filter(log => log.userId === userId);
    }

    if (since) {
      const sinceDate = new Date(since);
      filtered = filtered.filter(log => new Date(log.timestamp) > sinceDate);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    const results = filtered.slice(0, limit);

    // Calculate statistics
    const stats = {
      total: errorLogs.length,
      filtered: filtered.length,
      returned: results.length,
      levels: {
        critical: errorLogs.filter(log => log.level === "critical").length,
        error: errorLogs.filter(log => log.level === "error").length,
        warning: errorLogs.filter(log => log.level === "warning").length,
      },
      last24Hours: errorLogs.filter(log => new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
    };

    return NextResponse.json({
      errors: results,
      stats,
    });
  } catch (error) {
    console.error("Failed to retrieve error logs:", error);
    return NextResponse.json({ error: "Failed to retrieve error logs" }, { status: 500 });
  }
}

// Helper functions

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(clientIp);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (limit.count >= RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeInput(input: string): string {
  // Remove sensitive information
  const sensitivePatterns = [
    /api[_-]?key["\s]*[:=]["\s]*["']?[\w-]+["']?/gi,
    /password["\s]*[:=]["\s]*["']?[\w-]+["']?/gi,
    /token["\s]*[:=]["\s]*["']?[\w-]+["']?/gi,
    /secret["\s]*[:=]["\s]*["']?[\w-]+["']?/gi,
    /private[_-]?key["\s]*[:=]["\s]*["']?[\w-]+["']?/gi,
  ];

  let sanitized = input;
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }

  // Limit length
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000) + "... [truncated]";
  }

  return sanitized;
}

async function storeErrorLog(errorLog: ErrorLog): Promise<void> {
  // In production, store in database
  // For now, store in memory with size limit
  errorLogs.push(errorLog);

  // Keep only the latest errors
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs.splice(0, errorLogs.length - MAX_ERROR_LOGS);
  }

  // In production, you would store in MongoDB/PostgreSQL
  // Example:
  // await db.errorLogs.create({ data: errorLog });
}

async function sendErrorAlert(errorLog: ErrorLog): Promise<void> {
  // In production, send alerts via email, Slack, PagerDuty, etc.
  console.error("CRITICAL ERROR ALERT:", {
    id: errorLog.id,
    message: errorLog.message,
    timestamp: errorLog.timestamp,
    url: errorLog.url,
  });

  // Example Slack webhook (if configured)
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚨 Critical Error Alert`,
          attachments: [
            {
              color: "danger",
              fields: [
                { title: "Error ID", value: errorLog.id, short: true },
                { title: "Level", value: errorLog.level, short: true },
                { title: "Message", value: errorLog.message },
                { title: "URL", value: errorLog.url || "N/A" },
                { title: "Timestamp", value: errorLog.timestamp },
              ],
            },
          ],
        }),
      });
    } catch (error) {
      console.error("Failed to send Slack alert:", error);
    }
  }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime + RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);
