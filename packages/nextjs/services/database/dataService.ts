/**
 * Data Service
 * Unified data access layer for all database operations
 */
import mongoose from "mongoose";
import { connectDB } from "~~/lib/database/mongodb";
import { AuditEventType, AuditSeverity } from "~~/lib/security/auditLog";
import AuditLog, { IAuditLog } from "~~/models/AuditLog";
import Document, { DocumentStatus, DocumentType, IDocument } from "~~/models/Document";
import Equipment, { EquipmentCategory, IEquipment } from "~~/models/Equipment";
import Mission, { IMission, MissionStatus, MissionType } from "~~/models/Mission";
import User, { IUser, UserRole } from "~~/models/User";

export class DataService {
  private static instance: DataService;

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  /**
   * Ensure database connection
   */
  private async ensureConnection() {
    await connectDB();
  }

  // ==================== MISSION OPERATIONS ====================

  async createMission(data: {
    name: string;
    description: string;
    type: MissionType;
    owner: string;
    launchDate?: Date;
    orbit?: any;
    groundStations?: any[];
    tags?: string[];
  }): Promise<IMission> {
    await this.ensureConnection();

    const mission = new Mission({
      ...data,
      owner: new mongoose.Types.ObjectId(data.owner),
      status: MissionStatus.DRAFT,
    });

    await mission.save();

    // Log the creation
    await this.logAuditEvent({
      eventType: AuditEventType.MISSION_CREATED,
      action: `Created mission: ${mission.name}`,
      userId: data.owner,
      resourceType: "Mission",
      resourceId: mission.missionId,
      missionId: mission._id as mongoose.Types.ObjectId,
      result: "SUCCESS",
    });

    return mission;
  }

  async getMission(missionId: string): Promise<IMission | null> {
    await this.ensureConnection();
    return Mission.findOne({ missionId }).populate("owner collaborators equipment requirements documents").exec();
  }

  async updateMission(missionId: string, updates: Partial<IMission>, userId: string): Promise<IMission | null> {
    await this.ensureConnection();

    const mission = await Mission.findOneAndUpdate(
      { missionId },
      {
        ...updates,
        lastModifiedBy: new mongoose.Types.ObjectId(userId),
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (mission) {
      await this.logAuditEvent({
        eventType: AuditEventType.MISSION_UPDATED,
        action: `Updated mission: ${mission.name}`,
        userId,
        resourceType: "Mission",
        resourceId: mission.missionId,
        missionId: mission._id as mongoose.Types.ObjectId,
        metadata: { updates },
        result: "SUCCESS",
      });
    }

    return mission;
  }

  async deleteMission(missionId: string, userId: string): Promise<boolean> {
    await this.ensureConnection();

    const mission = await Mission.findOne({ missionId });
    if (!mission) return false;

    await mission.deleteOne();

    await this.logAuditEvent({
      eventType: AuditEventType.MISSION_DELETED,
      action: `Deleted mission: ${mission.name}`,
      userId,
      resourceType: "Mission",
      resourceId: missionId,
      result: "SUCCESS",
    });

    return true;
  }

  async getUserMissions(userId: string): Promise<IMission[]> {
    await this.ensureConnection();
    return Mission.findByUser(new mongoose.Types.ObjectId(userId));
  }

  async searchMissions(query: {
    type?: MissionType;
    status?: MissionStatus;
    tags?: string[];
    organization?: string;
  }): Promise<IMission[]> {
    await this.ensureConnection();

    const filter: any = {};

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.tags?.length) filter.tags = { $in: query.tags };
    if (query.organization) filter.organization = query.organization;

    return Mission.find(filter).populate("owner").sort({ createdAt: -1 }).limit(100).exec();
  }

  // ==================== EQUIPMENT OPERATIONS ====================

  async createEquipment(data: {
    name: string;
    description: string;
    category: EquipmentCategory;
    manufacturer: string;
    model: string;
    specifications?: any;
    createdBy: string;
  }): Promise<IEquipment> {
    await this.ensureConnection();

    const equipment = new Equipment({
      ...data,
      createdBy: new mongoose.Types.ObjectId(data.createdBy),
    });

    await equipment.save();

    await this.logAuditEvent({
      eventType: AuditEventType.EQUIPMENT_ADDED,
      action: `Created equipment: ${equipment.name}`,
      userId: data.createdBy,
      resourceType: "Equipment",
      resourceId: equipment.equipmentId,
      result: "SUCCESS",
    });

    return equipment;
  }

  async getEquipment(equipmentId: string): Promise<IEquipment | null> {
    await this.ensureConnection();
    return Equipment.findOne({ equipmentId }).populate("compatibleWith incompatibleWith missions createdBy").exec();
  }

  async searchEquipment(query: {
    category?: EquipmentCategory;
    manufacturer?: string;
    tags?: string[];
    trl?: number;
  }): Promise<IEquipment[]> {
    await this.ensureConnection();

    const filter: any = {};

    if (query.category) filter.category = query.category;
    if (query.manufacturer) filter.manufacturer = new RegExp(query.manufacturer, "i");
    if (query.tags?.length) filter.tags = { $in: query.tags };
    if (query.trl) filter.trl = { $gte: query.trl };

    return Equipment.find(filter).sort({ createdAt: -1 }).limit(100).exec();
  }

  // ==================== DOCUMENT OPERATIONS ====================

  async createDocument(data: {
    title: string;
    description?: string;
    type: DocumentType;
    mission: string;
    content?: string;
    authors: string[];
    owner: string;
  }): Promise<IDocument> {
    await this.ensureConnection();

    const document = new Document({
      ...data,
      mission: new mongoose.Types.ObjectId(data.mission),
      authors: data.authors.map(a => new mongoose.Types.ObjectId(a)),
      owner: new mongoose.Types.ObjectId(data.owner),
      status: DocumentStatus.DRAFT,
    });

    await document.save();

    await this.logAuditEvent({
      eventType: AuditEventType.DOCUMENT_CREATED,
      action: `Created document: ${document.title}`,
      userId: data.owner,
      resourceType: "Document",
      resourceId: document.documentId,
      missionId: document.mission,
      result: "SUCCESS",
    });

    return document;
  }

  async getDocument(documentId: string): Promise<IDocument | null> {
    await this.ensureConnection();
    return Document.findOne({ documentId }).populate("mission authors reviewers approvers owner sharedWith").exec();
  }

  async getMissionDocuments(missionId: string): Promise<IDocument[]> {
    await this.ensureConnection();
    const mission = await Mission.findOne({ missionId });
    if (!mission) return [];

    return Document.findByMission(mission._id as mongoose.Types.ObjectId);
  }

  // ==================== USER OPERATIONS ====================

  async createUser(data: {
    email: string;
    password?: string;
    name: string;
    roles?: UserRole[];
    organization?: string;
  }): Promise<IUser> {
    await this.ensureConnection();

    const user = new User({
      ...data,
      roles: data.roles || [UserRole.VIEWER],
    });

    await user.save();

    await this.logAuditEvent({
      eventType: AuditEventType.USER_REGISTER,
      action: `User registered: ${user.email}`,
      userId: user.userId,
      userEmail: user.email,
      result: "SUCCESS",
    });

    return user;
  }

  async getUser(userId: string): Promise<IUser | null> {
    await this.ensureConnection();
    return User.findOne({ userId });
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    await this.ensureConnection();
    return User.findByEmail(email);
  }

  async updateUser(userId: string, updates: Partial<IUser>): Promise<IUser | null> {
    await this.ensureConnection();

    const user = await User.findOneAndUpdate({ userId }, updates, { new: true });

    return user;
  }

  // ==================== AUDIT LOG OPERATIONS ====================

  async logAuditEvent(data: {
    eventType: AuditEventType;
    action: string;
    userId?: string;
    userEmail?: string;
    severity?: AuditSeverity;
    resourceType?: string;
    resourceId?: string;
    missionId?: mongoose.Types.ObjectId;
    metadata?: any;
    result: "SUCCESS" | "FAILURE";
    errorMessage?: string;
    duration?: number;
  }): Promise<void> {
    await this.ensureConnection();

    const auditLog = new AuditLog({
      ...data,
      severity: data.severity || AuditSeverity.INFO,
      timestamp: new Date(),
    });

    await auditLog.save();
  }

  async queryAuditLogs(filter: {
    userId?: string;
    eventType?: AuditEventType;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    resourceType?: string;
    result?: "SUCCESS" | "FAILURE";
  }): Promise<IAuditLog[]> {
    await this.ensureConnection();

    const query: any = {};

    if (filter.userId) query.userId = filter.userId;
    if (filter.eventType) query.eventType = filter.eventType;
    if (filter.severity) query.severity = filter.severity;
    if (filter.resourceType) query.resourceType = filter.resourceType;
    if (filter.result) query.result = filter.result;

    if (filter.startDate || filter.endDate) {
      query.timestamp = {};
      if (filter.startDate) query.timestamp.$gte = filter.startDate;
      if (filter.endDate) query.timestamp.$lte = filter.endDate;
    }

    return AuditLog.find(query).sort({ timestamp: -1 }).limit(1000).exec();
  }

  async getAuditStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    await this.ensureConnection();
    return AuditLog.getStatistics(startDate, endDate);
  }

  // ==================== UTILITY OPERATIONS ====================

  async healthCheck(): Promise<{
    connected: boolean;
    database: string;
    collections: number;
  }> {
    try {
      await this.ensureConnection();

      const db = mongoose.connection.db;
      if (!db) {
        return { connected: false, database: "", collections: 0 };
      }

      const collections = await db.listCollections().toArray();

      return {
        connected: mongoose.connection.readyState === 1,
        database: db.databaseName,
        collections: collections.length,
      };
    } catch (error) {
      return { connected: false, database: "", collections: 0 };
    }
  }

  async runMigrations(): Promise<void> {
    await this.ensureConnection();

    // Create indexes
    await Mission.createIndexes();
    await Equipment.createIndexes();
    await Document.createIndexes();
    await User.createIndexes();
    await AuditLog.createIndexes();

    console.log("✅ Database migrations completed");
  }
}

// Export singleton instance
export const dataService = DataService.getInstance();
