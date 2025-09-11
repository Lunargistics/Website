/**
 * Audit Logging Service
 * Tracks all critical operations for compliance and security
 */
import { encryptionService } from "./encryption";

export enum AuditEventType {
  // Authentication events
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  USER_REGISTER = "USER_REGISTER",
  PASSWORD_RESET = "PASSWORD_RESET",
  TWO_FACTOR_ENABLED = "TWO_FACTOR_ENABLED",

  // Mission events
  MISSION_CREATED = "MISSION_CREATED",
  MISSION_UPDATED = "MISSION_UPDATED",
  MISSION_DELETED = "MISSION_DELETED",
  MISSION_EXPORTED = "MISSION_EXPORTED",
  MISSION_SHARED = "MISSION_SHARED",

  // Document events
  DOCUMENT_CREATED = "DOCUMENT_CREATED",
  DOCUMENT_ACCESSED = "DOCUMENT_ACCESSED",
  DOCUMENT_MODIFIED = "DOCUMENT_MODIFIED",
  DOCUMENT_DELETED = "DOCUMENT_DELETED",
  DOCUMENT_SIGNED = "DOCUMENT_SIGNED",

  // Equipment events
  EQUIPMENT_ADDED = "EQUIPMENT_ADDED",
  EQUIPMENT_MODIFIED = "EQUIPMENT_MODIFIED",
  EQUIPMENT_REMOVED = "EQUIPMENT_REMOVED",

  // Compliance events
  COMPLIANCE_CHECK = "COMPLIANCE_CHECK",
  COMPLIANCE_VIOLATION = "COMPLIANCE_VIOLATION",
  COMPLIANCE_APPROVED = "COMPLIANCE_APPROVED",

  // Smart contract events
  CONTRACT_DEPLOYED = "CONTRACT_DEPLOYED",
  CONTRACT_INTERACTION = "CONTRACT_INTERACTION",
  NFT_MINTED = "NFT_MINTED",
  NFT_TRANSFERRED = "NFT_TRANSFERRED",

  // System events
  SYSTEM_ERROR = "SYSTEM_ERROR",
  SECURITY_ALERT = "SECURITY_ALERT",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  DATA_EXPORT = "DATA_EXPORT",
  DATA_IMPORT = "DATA_IMPORT",
  BACKUP_CREATED = "BACKUP_CREATED",

  // API events
  API_REQUEST = "API_REQUEST",
  API_ERROR = "API_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

export enum AuditSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  result: "SUCCESS" | "FAILURE";
  errorMessage?: string;
  duration?: number; // in milliseconds
  signature?: string; // for integrity verification
}

export interface AuditLogFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  result?: "SUCCESS" | "FAILURE";
}

export class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLogEntry[] = [];
  private readonly maxInMemoryLogs = 1000;
  private batchSize = 100;
  private flushInterval = 60000; // 1 minute
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // Start periodic flush
    this.startPeriodicFlush();
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit event
   */
  async log(
    eventType: AuditEventType,
    action: string,
    options: {
      userId?: string;
      userEmail?: string;
      ipAddress?: string;
      userAgent?: string;
      severity?: AuditSeverity;
      resourceType?: string;
      resourceId?: string;
      metadata?: Record<string, any>;
      result?: "SUCCESS" | "FAILURE";
      errorMessage?: string;
      duration?: number;
    } = {},
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      eventType,
      severity: options.severity || this.getSeverityForEventType(eventType),
      action,
      result: options.result || "SUCCESS",
      ...options,
    };

    // Add signature for integrity
    entry.signature = this.signEntry(entry);

    // Add to in-memory buffer
    this.logs.push(entry);

    // Encrypt sensitive data if configured
    if (this.shouldEncrypt(eventType)) {
      entry.metadata = entry.metadata ? { encrypted: encryptionService.encryptObject(entry.metadata) } : undefined;
    }

    // Immediate flush for critical events
    if (entry.severity === AuditSeverity.CRITICAL) {
      await this.flush();
    } else if (this.logs.length >= this.batchSize) {
      await this.flush();
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      this.logToConsole(entry);
    }
  }

  /**
   * Query audit logs
   */
  async query(filter: AuditLogFilter): Promise<AuditLogEntry[]> {
    // In production, this would query from database
    // For now, filter in-memory logs
    return this.logs.filter(log => {
      if (filter.startDate && log.timestamp < filter.startDate) return false;
      if (filter.endDate && log.timestamp > filter.endDate) return false;
      if (filter.userId && log.userId !== filter.userId) return false;
      if (filter.eventType && log.eventType !== filter.eventType) return false;
      if (filter.severity && log.severity !== filter.severity) return false;
      if (filter.resourceType && log.resourceType !== filter.resourceType) return false;
      if (filter.resourceId && log.resourceId !== filter.resourceId) return false;
      if (filter.result && log.result !== filter.result) return false;
      return true;
    });
  }

  /**
   * Get audit statistics
   */
  async getStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    eventsByResult: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    averageDuration: number;
  }> {
    const logs = await this.query({ startDate, endDate });

    const stats = {
      totalEvents: logs.length,
      eventsByType: {} as Record<string, number>,
      eventsBySeverity: {} as Record<string, number>,
      eventsByResult: {} as Record<string, number>,
      topUsers: [] as Array<{ userId: string; count: number }>,
      averageDuration: 0,
    };

    const userCounts: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;

    for (const log of logs) {
      // Count by type
      stats.eventsByType[log.eventType] = (stats.eventsByType[log.eventType] || 0) + 1;

      // Count by severity
      stats.eventsBySeverity[log.severity] = (stats.eventsBySeverity[log.severity] || 0) + 1;

      // Count by result
      stats.eventsByResult[log.result] = (stats.eventsByResult[log.result] || 0) + 1;

      // Count by user
      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
      }

      // Calculate average duration
      if (log.duration) {
        totalDuration += log.duration;
        durationCount++;
      }
    }

    // Get top users
    stats.topUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    // Calculate average duration
    stats.averageDuration = durationCount > 0 ? totalDuration / durationCount : 0;

    return stats;
  }

  /**
   * Export audit logs
   */
  async export(filter: AuditLogFilter, format: "json" | "csv" = "json"): Promise<string> {
    const logs = await this.query(filter);

    if (format === "csv") {
      return this.toCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Verify log integrity
   */
  verifyIntegrity(entry: AuditLogEntry): boolean {
    if (!entry.signature) return false;

    const computedSignature = this.signEntry(entry);
    return entry.signature === computedSignature;
  }

  /**
   * Flush logs to persistent storage
   */
  private async flush(): Promise<void> {
    if (this.logs.length === 0) return;

    const logsToFlush = [...this.logs];
    this.logs = [];

    try {
      // In production, this would write to database
      // For now, we'll just log that we would flush
      console.log(`[Audit] Flushing ${logsToFlush.length} audit logs to storage`);

      // TODO: Implement actual database storage
      // await this.persistToDatabase(logsToFlush);

      // Keep last N logs in memory for quick access
      if (this.logs.length > this.maxInMemoryLogs) {
        this.logs = this.logs.slice(-this.maxInMemoryLogs);
      }
    } catch (error) {
      console.error("[Audit] Failed to flush logs:", error);
      // Re-add logs to buffer
      this.logs = [...logsToFlush, ...this.logs];
    }
  }

  /**
   * Start periodic flush timer
   */
  private startPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushInterval);
  }

  /**
   * Generate unique ID for log entry
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sign log entry for integrity verification
   */
  private signEntry(entry: AuditLogEntry): string {
    const dataToSign = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      eventType: entry.eventType,
      action: entry.action,
      userId: entry.userId,
      result: entry.result,
    });

    return encryptionService.signData(dataToSign);
  }

  /**
   * Determine if event should be encrypted
   */
  private shouldEncrypt(eventType: AuditEventType): boolean {
    const encryptedTypes = [
      AuditEventType.PASSWORD_RESET,
      AuditEventType.USER_REGISTER,
      AuditEventType.DOCUMENT_SIGNED,
      AuditEventType.SECURITY_ALERT,
    ];

    return encryptedTypes.includes(eventType);
  }

  /**
   * Get default severity for event type
   */
  private getSeverityForEventType(eventType: AuditEventType): AuditSeverity {
    const severityMap: Partial<Record<AuditEventType, AuditSeverity>> = {
      [AuditEventType.SECURITY_ALERT]: AuditSeverity.CRITICAL,
      [AuditEventType.COMPLIANCE_VIOLATION]: AuditSeverity.ERROR,
      [AuditEventType.PERMISSION_DENIED]: AuditSeverity.WARNING,
      [AuditEventType.SYSTEM_ERROR]: AuditSeverity.ERROR,
      [AuditEventType.RATE_LIMIT_EXCEEDED]: AuditSeverity.WARNING,
    };

    return severityMap[eventType] || AuditSeverity.INFO;
  }

  /**
   * Log to console in development
   */
  private logToConsole(entry: AuditLogEntry): void {
    const icon = {
      [AuditSeverity.INFO]: "ℹ️",
      [AuditSeverity.WARNING]: "⚠️",
      [AuditSeverity.ERROR]: "❌",
      [AuditSeverity.CRITICAL]: "🚨",
    }[entry.severity];

    console.log(`${icon} [Audit] ${entry.eventType}: ${entry.action}`, {
      userId: entry.userId,
      result: entry.result,
      metadata: entry.metadata,
    });
  }

  /**
   * Convert logs to CSV format
   */
  private toCSV(logs: AuditLogEntry[]): string {
    const headers = [
      "ID",
      "Timestamp",
      "Event Type",
      "Severity",
      "Action",
      "User ID",
      "User Email",
      "Result",
      "Resource Type",
      "Resource ID",
      "Duration (ms)",
      "Error Message",
    ];

    const rows = logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.eventType,
      log.severity,
      log.action,
      log.userId || "",
      log.userEmail || "",
      log.result,
      log.resourceType || "",
      log.resourceId || "",
      log.duration?.toString() || "",
      log.errorMessage || "",
    ]);

    return [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();
