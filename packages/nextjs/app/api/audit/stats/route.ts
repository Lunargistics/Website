/**
 * API endpoint for audit statistics
 * GET /api/audit/stats - Get audit statistics
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Permission, rbacManager } from "~~/lib/auth/rbac";
import { AuditEventType, AuditSeverity, auditLogger } from "~~/lib/security/auditLog";

/**
 * Get audit statistics
 * Requires SYSTEM_ADMIN permission
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check authorization
    const hasPermission = await rbacManager.hasPermission(session.user as any, Permission.SYSTEM_ADMIN);

    if (!hasPermission) {
      await auditLogger.log(AuditEventType.PERMISSION_DENIED, "Attempted to access audit statistics", {
        userId: session.user.email || "",
        userEmail: session.user.email || "",
        severity: AuditSeverity.WARNING,
        result: "FAILURE",
      });

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Parse query parameters for date range
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;

    // Get statistics
    const stats = await auditLogger.getStatistics(startDate, endDate);

    // Log the access
    await auditLogger.log(AuditEventType.DATA_EXPORT, "Accessed audit statistics", {
      userId: session.user.email || "",
      userEmail: session.user.email || "",
      metadata: { startDate, endDate },
      result: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      data: stats,
      period: {
        startDate: startDate?.toISOString() || "all-time",
        endDate: endDate?.toISOString() || "current",
      },
    });
  } catch (error) {
    console.error("Error getting audit statistics:", error);

    await auditLogger.log(AuditEventType.SYSTEM_ERROR, "Failed to get audit statistics", {
      severity: AuditSeverity.ERROR,
      result: "FAILURE",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ error: "Failed to get audit statistics" }, { status: 500 });
  }
}
