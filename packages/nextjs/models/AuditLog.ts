/**
 * AuditLog Model
 * MongoDB schema for audit trail and compliance logging
 */
import mongoose, { Document, Model, Schema } from "mongoose";
import { AuditEventType, AuditSeverity } from "~~/lib/security/auditLog";

export interface IAuditLog extends Document {
  auditId: string;
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
  missionId?: mongoose.Types.ObjectId;
  metadata?: any;
  result: "SUCCESS" | "FAILURE";
  errorMessage?: string;
  duration?: number;
  signature?: string;

  // Compliance fields
  complianceStandard?: string;
  complianceStatus?: string;

  // Session tracking
  sessionId?: string;
  requestId?: string;

  // Additional context
  environment?: string;
  apiVersion?: string;
  clientVersion?: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    auditId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: Object.values(AuditEventType),
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: Object.values(AuditSeverity),
      required: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    userEmail: {
      type: String,
      index: true,
    },
    ipAddress: String,
    userAgent: String,
    action: {
      type: String,
      required: true,
      maxlength: 500,
    },
    resourceType: {
      type: String,
      index: true,
    },
    resourceId: {
      type: String,
      index: true,
    },
    missionId: {
      type: Schema.Types.ObjectId,
      ref: "Mission",
      index: true,
    },
    metadata: Schema.Types.Mixed,
    result: {
      type: String,
      enum: ["SUCCESS", "FAILURE"],
      required: true,
      index: true,
    },
    errorMessage: String,
    duration: Number,
    signature: String,

    // Compliance
    complianceStandard: String,
    complianceStatus: String,

    // Session
    sessionId: String,
    requestId: String,

    // Context
    environment: String,
    apiVersion: String,
    clientVersion: String,
  },
  {
    timestamps: false, // We use our own timestamp field
    collection: "auditlogs",
  },
);

// Indexes for query performance
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ eventType: 1, timestamp: -1 });
AuditLogSchema.index({ severity: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ result: 1, timestamp: -1 });
AuditLogSchema.index({ missionId: 1, timestamp: -1 });

// TTL index for automatic cleanup (keep logs for 2 years)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

// Static methods for common queries
AuditLogSchema.statics.findByUser = function (userId: string, startDate?: Date, endDate?: Date) {
  const query: any = { userId };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return this.find(query).sort({ timestamp: -1 });
};

AuditLogSchema.statics.findByMission = function (missionId: mongoose.Types.ObjectId, startDate?: Date, endDate?: Date) {
  const query: any = { missionId };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return this.find(query).sort({ timestamp: -1 });
};

AuditLogSchema.statics.findCriticalEvents = function (hours: number = 24) {
  const since = new Date();
  since.setHours(since.getHours() - hours);

  return this.find({
    severity: { $in: [AuditSeverity.ERROR, AuditSeverity.CRITICAL] },
    timestamp: { $gte: since },
  }).sort({ timestamp: -1 });
};

AuditLogSchema.statics.findFailures = function (resourceType?: string, hours: number = 24) {
  const since = new Date();
  since.setHours(since.getHours() - hours);

  const query: any = {
    result: "FAILURE",
    timestamp: { $gte: since },
  };

  if (resourceType) {
    query.resourceType = resourceType;
  }

  return this.find(query).sort({ timestamp: -1 });
};

AuditLogSchema.statics.getStatistics = async function (startDate?: Date, endDate?: Date) {
  const match: any = {};

  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = startDate;
    if (endDate) match.timestamp.$lte = endDate;
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ["$result", "SUCCESS"] }, 1, 0] },
        },
        failureCount: {
          $sum: { $cond: [{ $eq: ["$result", "FAILURE"] }, 1, 0] },
        },
        averageDuration: { $avg: "$duration" },
        uniqueUsers: { $addToSet: "$userId" },
      },
    },
    {
      $project: {
        _id: 0,
        totalEvents: 1,
        successCount: 1,
        failureCount: 1,
        averageDuration: 1,
        uniqueUserCount: { $size: "$uniqueUsers" },
      },
    },
  ]);

  const eventsByType = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$eventType",
        count: { $sum: 1 },
      },
    },
  ]);

  const eventsBySeverity = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$severity",
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    ...stats[0],
    eventsByType: eventsByType.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    eventsBySeverity: eventsBySeverity.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
  };
};

// Pre-save middleware
AuditLogSchema.pre("save", function (next) {
  if (!this.auditId) {
    this.auditId = `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  if (!this.timestamp) {
    this.timestamp = new Date();
  }
  next();
});

// Add interface for static methods
interface IAuditLogModel extends Model<IAuditLog> {
  findByUser(userId: string, startDate?: Date, endDate?: Date): Promise<IAuditLog[]>;
  findByMission(missionId: mongoose.Types.ObjectId, startDate?: Date, endDate?: Date): Promise<IAuditLog[]>;
  findCriticalEvents(hours?: number): Promise<IAuditLog[]>;
  findFailures(resourceType?: string, hours?: number): Promise<IAuditLog[]>;
  getStatistics(startDate?: Date, endDate?: Date): Promise<any>;
}

// Export the model
const AuditLog = (mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema)) as IAuditLogModel;

export default AuditLog;
