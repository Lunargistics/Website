/**
 * API endpoint for audit log management
 * GET /api/audit/logs - Query audit logs
 * POST /api/audit/logs/export - Export audit logs
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Permission, rbacManager } from "~~/lib/auth/rbac";
import { AuditEventType, AuditLogFilter, AuditSeverity, auditLogger } from "~~/lib/security/auditLog";

/**
 * Query audit logs
 * Requires SYSTEM_ADMIN permission
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check authorization - only admins can view audit logs
    const hasPermission = await rbacManager.hasPermission(session.user as any, Permission.SYSTEM_ADMIN);

    if (!hasPermission) {
      // Log the unauthorized access attempt
      await auditLogger.log(AuditEventType.PERMISSION_DENIED, "Attempted to access audit logs", {
        userId: session.user.email || "",
        userEmail: session.user.email || "",
        severity: AuditSeverity.WARNING,
        result: "FAILURE",
        errorMessage: "Insufficient permissions",
      });

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filter: AuditLogFilter = {};

    if (searchParams.get("startDate")) {
      filter.startDate = new Date(searchParams.get("startDate")!);
    }
    if (searchParams.get("endDate")) {
      filter.endDate = new Date(searchParams.get("endDate")!);
    }
    if (searchParams.get("userId")) {
      filter.userId = searchParams.get("userId")!;
    }
    if (searchParams.get("eventType")) {
      filter.eventType = searchParams.get("eventType") as AuditEventType;
    }
    if (searchParams.get("severity")) {
      filter.severity = searchParams.get("severity") as AuditSeverity;
    }
    if (searchParams.get("resourceType")) {
      filter.resourceType = searchParams.get("resourceType")!;
    }
    if (searchParams.get("resourceId")) {
      filter.resourceId = searchParams.get("resourceId")!;
    }
    if (searchParams.get("result")) {
      filter.result = searchParams.get("result") as "SUCCESS" | "FAILURE";
    }

    // Query logs
    const logs = await auditLogger.query(filter);

    // Log the access
    await auditLogger.log(AuditEventType.DATA_EXPORT, "Accessed audit logs", {
      userId: session.user.email || "",
      userEmail: session.user.email || "",
      metadata: { filter, count: logs.length },
      result: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("Error querying audit logs:", error);

    await auditLogger.log(AuditEventType.SYSTEM_ERROR, "Failed to query audit logs", {
      severity: AuditSeverity.ERROR,
      result: "FAILURE",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ error: "Failed to query audit logs" }, { status: 500 });
  }
}

/**
 * Export audit logs
 * Requires SYSTEM_ADMIN permission
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check authorization
    const hasPermission = await rbacManager.hasPermission(session.user as any, Permission.SYSTEM_ADMIN);

    if (!hasPermission) {
      await auditLogger.log(AuditEventType.PERMISSION_DENIED, "Attempted to export audit logs", {
        userId: session.user.email || "",
        userEmail: session.user.email || "",
        severity: AuditSeverity.WARNING,
        result: "FAILURE",
      });

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { filter = {}, format = "json" } = body;

    // Export logs
    const exportData = await auditLogger.export(filter, format);

    // Log the export
    await auditLogger.log(AuditEventType.DATA_EXPORT, "Exported audit logs", {
      userId: session.user.email || "",
      userEmail: session.user.email || "",
      metadata: { filter, format },
      result: "SUCCESS",
    });

    // Set appropriate headers based on format
    const headers: HeadersInit = {
      "Content-Disposition": `attachment; filename=audit-logs-${Date.now()}.${format}`,
    };

    if (format === "csv") {
      headers["Content-Type"] = "text/csv";
    } else {
      headers["Content-Type"] = "application/json";
    }

    return new NextResponse(exportData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error exporting audit logs:", error);

    await auditLogger.log(AuditEventType.SYSTEM_ERROR, "Failed to export audit logs", {
      severity: AuditSeverity.ERROR,
      result: "FAILURE",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ error: "Failed to export audit logs" }, { status: 500 });
  }
}
