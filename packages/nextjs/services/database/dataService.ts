/**
 * Data Service
 * Unified data access layer for all database operations.
 *
 * Migrated from Mongoose to Prisma + Postgres. References (owner, mission,
 * createdBy, ...) are plain id strings; former `.populate()` calls are replaced
 * by explicit follow-up fetches that attach the referenced rows to the result.
 */
import { Prisma } from "@prisma/client";
import { findByEmail as findUserByEmail, generateUserId, hashPassword } from "~~/lib/db/userHelpers";
import { prisma } from "~~/lib/prisma";
import { AuditEventType, AuditSeverity } from "~~/lib/security/auditLog";
import { IAuditLog } from "~~/models/AuditLog";
import { DocumentStatus, DocumentType, IDocument } from "~~/models/Document";
import { EquipmentCategory, IEquipment } from "~~/models/Equipment";
import { IMission, MissionStatus, MissionType } from "~~/models/Mission";
import { IUser, UserRole } from "~~/models/User";

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
   * Ensure database connection.
   *
   * Prisma manages its own connection pool and connects lazily on first query,
   * so this is now a no-op kept for backwards-compatible call sites.
   */
  private async ensureConnection() {
    // No-op: Prisma connects lazily.
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

    const missionId = `MISSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const mission = await prisma.mission.create({
      data: {
        missionId,
        name: data.name,
        description: data.description,
        type: data.type,
        owner: data.owner,
        status: MissionStatus.DRAFT,
        launchDate: data.launchDate,
        orbit: (data.orbit ?? undefined) as Prisma.InputJsonValue | undefined,
        groundStations: (data.groundStations ?? []) as unknown as Prisma.InputJsonValue,
        tags: data.tags ?? [],
      },
    });

    // Log the creation
    await this.logAuditEvent({
      eventType: AuditEventType.MISSION_CREATED,
      action: `Created mission: ${mission.name}`,
      userId: data.owner,
      resourceType: "Mission",
      resourceId: mission.missionId,
      missionId: mission.id,
      result: "SUCCESS",
    });

    return mission as unknown as IMission;
  }

  async getMission(missionId: string): Promise<IMission | null> {
    await this.ensureConnection();

    const mission = await prisma.mission.findUnique({ where: { missionId } });
    if (!mission) return null;

    // Replace the former `.populate("owner collaborators equipment requirements documents")`
    // by fetching the referenced rows and attaching them.
    const [owner, collaborators, equipment, documents] = await Promise.all([
      prisma.user.findUnique({ where: { id: mission.owner } }),
      mission.collaborators.length
        ? prisma.user.findMany({ where: { id: { in: mission.collaborators } } })
        : Promise.resolve([]),
      mission.equipment.length
        ? prisma.equipment.findMany({ where: { id: { in: mission.equipment } } })
        : Promise.resolve([]),
      mission.documents.length
        ? prisma.document.findMany({ where: { id: { in: mission.documents } } })
        : Promise.resolve([]),
    ]);

    return {
      ...(mission as unknown as IMission),
      owner: (owner as any) ?? mission.owner,
      collaborators: collaborators as any,
      equipment: equipment as any,
      // `requirements` has no backing table; keep the raw id strings.
      requirements: mission.requirements as any,
      documents: documents as any,
    } as unknown as IMission;
  }

  async updateMission(missionId: string, updates: Partial<IMission>, userId: string): Promise<IMission | null> {
    await this.ensureConnection();

    // Strip immutable / managed fields before persisting.
    const { id: _id, missionId: _missionId, createdAt: _createdAt, ...rest } = updates as any;

    const result = await prisma.mission.updateMany({
      where: { missionId },
      data: {
        ...(rest as Prisma.MissionUpdateInput),
        lastModifiedBy: userId,
      },
    });

    if (result.count === 0) return null;

    const mission = await prisma.mission.findUnique({ where: { missionId } });

    if (mission) {
      await this.logAuditEvent({
        eventType: AuditEventType.MISSION_UPDATED,
        action: `Updated mission: ${mission.name}`,
        userId,
        resourceType: "Mission",
        resourceId: mission.missionId,
        missionId: mission.id,
        metadata: { updates },
        result: "SUCCESS",
      });
    }

    return mission as unknown as IMission | null;
  }

  async deleteMission(missionId: string, userId: string): Promise<boolean> {
    await this.ensureConnection();

    const mission = await prisma.mission.findUnique({ where: { missionId } });
    if (!mission) return false;

    await prisma.mission.deleteMany({ where: { missionId } });

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

    // Former Mission.findByUser: owner === userId OR collaborators contains userId.
    const missions = await prisma.mission.findMany({
      where: {
        OR: [{ owner: userId }, { collaborators: { has: userId } }],
      },
    });

    return missions as unknown as IMission[];
  }

  async searchMissions(query: {
    type?: MissionType;
    status?: MissionStatus;
    tags?: string[];
    organization?: string;
  }): Promise<IMission[]> {
    await this.ensureConnection();

    const where: Prisma.MissionWhereInput = {};

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.tags?.length) where.tags = { hasSome: query.tags };
    if (query.organization) where.organization = query.organization;

    const missions = await prisma.mission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Former `.populate("owner")` — attach owner rows.
    const ownerIds = Array.from(new Set(missions.map(m => m.owner)));
    const owners = ownerIds.length ? await prisma.user.findMany({ where: { id: { in: ownerIds } } }) : [];
    const ownerById = new Map(owners.map(o => [o.id, o]));

    return missions.map(m => ({
      ...(m as unknown as IMission),
      owner: (ownerById.get(m.owner) as any) ?? m.owner,
    })) as unknown as IMission[];
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

    const equipmentId = `EQP-${data.category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const equipment = await prisma.equipment.create({
      data: {
        equipmentId,
        name: data.name,
        description: data.description,
        category: data.category,
        manufacturer: data.manufacturer,
        // Schema column is `modelName`; the caller passes `model`.
        modelName: data.model,
        specifications: (data.specifications ?? undefined) as Prisma.InputJsonValue | undefined,
        createdBy: data.createdBy,
      },
    });

    await this.logAuditEvent({
      eventType: AuditEventType.EQUIPMENT_ADDED,
      action: `Created equipment: ${equipment.name}`,
      userId: data.createdBy,
      resourceType: "Equipment",
      resourceId: equipment.equipmentId,
      result: "SUCCESS",
    });

    return equipment as unknown as IEquipment;
  }

  async getEquipment(equipmentId: string): Promise<IEquipment | null> {
    await this.ensureConnection();

    const equipment = await prisma.equipment.findUnique({ where: { equipmentId } });
    if (!equipment) return null;

    // Replace `.populate("compatibleWith incompatibleWith missions createdBy")`.
    const [compatibleWith, incompatibleWith, missions, createdBy] = await Promise.all([
      equipment.compatibleWith.length
        ? prisma.equipment.findMany({ where: { id: { in: equipment.compatibleWith } } })
        : Promise.resolve([]),
      equipment.incompatibleWith.length
        ? prisma.equipment.findMany({ where: { id: { in: equipment.incompatibleWith } } })
        : Promise.resolve([]),
      equipment.missions.length
        ? prisma.mission.findMany({ where: { id: { in: equipment.missions } } })
        : Promise.resolve([]),
      prisma.user.findUnique({ where: { id: equipment.createdBy } }),
    ]);

    return {
      ...(equipment as unknown as IEquipment),
      compatibleWith: compatibleWith as any,
      incompatibleWith: incompatibleWith as any,
      missions: missions as any,
      createdBy: (createdBy as any) ?? equipment.createdBy,
    } as unknown as IEquipment;
  }

  async searchEquipment(query: {
    category?: EquipmentCategory;
    manufacturer?: string;
    tags?: string[];
    trl?: number;
  }): Promise<IEquipment[]> {
    await this.ensureConnection();

    const where: Prisma.EquipmentWhereInput = {};

    if (query.category) where.category = query.category;
    if (query.manufacturer) where.manufacturer = { contains: query.manufacturer, mode: "insensitive" };
    if (query.tags?.length) where.tags = { hasSome: query.tags };
    if (query.trl) where.trl = { gte: query.trl };

    const equipment = await prisma.equipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return equipment as unknown as IEquipment[];
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

    const documentId = `DOC-${data.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const document = await prisma.document.create({
      data: {
        documentId,
        title: data.title,
        description: data.description,
        type: data.type,
        mission: data.mission,
        content: data.content,
        authors: data.authors,
        owner: data.owner,
        status: DocumentStatus.DRAFT,
      },
    });

    await this.logAuditEvent({
      eventType: AuditEventType.DOCUMENT_CREATED,
      action: `Created document: ${document.title}`,
      userId: data.owner,
      resourceType: "Document",
      resourceId: document.documentId,
      missionId: document.mission,
      result: "SUCCESS",
    });

    return document as unknown as IDocument;
  }

  async getDocument(documentId: string): Promise<IDocument | null> {
    await this.ensureConnection();

    const document = await prisma.document.findUnique({ where: { documentId } });
    if (!document) return null;

    // Replace `.populate("mission authors reviewers approvers owner sharedWith")`.
    const [mission, authors, reviewers, approvers, owner, sharedWith] = await Promise.all([
      prisma.mission.findUnique({ where: { id: document.mission } }),
      document.authors.length ? prisma.user.findMany({ where: { id: { in: document.authors } } }) : Promise.resolve([]),
      document.reviewers.length
        ? prisma.user.findMany({ where: { id: { in: document.reviewers } } })
        : Promise.resolve([]),
      document.approvers.length
        ? prisma.user.findMany({ where: { id: { in: document.approvers } } })
        : Promise.resolve([]),
      prisma.user.findUnique({ where: { id: document.owner } }),
      document.sharedWith.length
        ? prisma.user.findMany({ where: { id: { in: document.sharedWith } } })
        : Promise.resolve([]),
    ]);

    return {
      ...(document as unknown as IDocument),
      mission: (mission as any) ?? document.mission,
      authors: authors as any,
      reviewers: reviewers as any,
      approvers: approvers as any,
      owner: (owner as any) ?? document.owner,
      sharedWith: sharedWith as any,
    } as unknown as IDocument;
  }

  async getMissionDocuments(missionId: string): Promise<IDocument[]> {
    await this.ensureConnection();

    const mission = await prisma.mission.findUnique({ where: { missionId } });
    if (!mission) return [];

    // Former Document.findByMission(mission._id), sorted newest-first.
    const documents = await prisma.document.findMany({
      where: { mission: mission.id },
      orderBy: { createdAt: "desc" },
    });

    return documents as unknown as IDocument[];
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

    const user = await prisma.user.create({
      data: {
        userId: generateUserId(),
        email: data.email.toLowerCase(),
        password: data.password ? await hashPassword(data.password) : undefined,
        name: data.name,
        roles: data.roles ?? [UserRole.VIEWER],
        organization: data.organization,
      },
    });

    await this.logAuditEvent({
      eventType: AuditEventType.USER_REGISTER,
      action: `User registered: ${user.email}`,
      userId: user.userId ?? undefined,
      userEmail: user.email,
      result: "SUCCESS",
    });

    return user as unknown as IUser;
  }

  async getUser(userId: string): Promise<IUser | null> {
    await this.ensureConnection();

    const user = await prisma.user.findUnique({ where: { userId } });
    return user as unknown as IUser | null;
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    await this.ensureConnection();

    const user = await findUserByEmail(email);
    return user as unknown as IUser | null;
  }

  async updateUser(userId: string, updates: Partial<IUser>): Promise<IUser | null> {
    await this.ensureConnection();

    // Strip immutable / managed fields before persisting.
    const { id: _id, userId: _userId, createdAt: _createdAt, ...rest } = updates as any;

    const result = await prisma.user.updateMany({
      where: { userId },
      data: rest as Prisma.UserUpdateInput,
    });

    if (result.count === 0) return null;

    const user = await prisma.user.findUnique({ where: { userId } });
    return user as unknown as IUser | null;
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
    missionId?: string;
    metadata?: any;
    result: "SUCCESS" | "FAILURE";
    errorMessage?: string;
    duration?: number;
  }): Promise<void> {
    await this.ensureConnection();

    const auditId = `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await prisma.auditLog.create({
      data: {
        auditId,
        eventType: data.eventType,
        action: data.action,
        userId: data.userId,
        userEmail: data.userEmail,
        severity: data.severity ?? AuditSeverity.INFO,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        missionId: data.missionId,
        metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        result: data.result,
        errorMessage: data.errorMessage,
        duration: data.duration,
        timestamp: new Date(),
      },
    });
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

    const where: Prisma.AuditLogWhereInput = {};

    if (filter.userId) where.userId = filter.userId;
    if (filter.eventType) where.eventType = filter.eventType;
    if (filter.severity) where.severity = filter.severity;
    if (filter.resourceType) where.resourceType = filter.resourceType;
    if (filter.result) where.result = filter.result;

    if (filter.startDate || filter.endDate) {
      where.timestamp = {};
      if (filter.startDate) where.timestamp.gte = filter.startDate;
      if (filter.endDate) where.timestamp.lte = filter.endDate;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 1000,
    });

    return logs as unknown as IAuditLog[];
  }

  async getAuditStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    await this.ensureConnection();

    // Former AuditLog.getStatistics aggregation, re-implemented with Prisma.
    const where: Prisma.AuditLogWhereInput = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      select: { result: true, duration: true, userId: true, eventType: true, severity: true },
    });

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    let successCount = 0;
    let failureCount = 0;
    let totalDuration = 0;
    let durationCount = 0;

    for (const log of logs) {
      if (log.result === "SUCCESS") successCount++;
      else if (log.result === "FAILURE") failureCount++;

      if (log.duration != null) {
        totalDuration += log.duration;
        durationCount++;
      }

      if (log.userId) uniqueUsers.add(log.userId);

      eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;
      eventsBySeverity[log.severity] = (eventsBySeverity[log.severity] || 0) + 1;
    }

    return {
      totalEvents: logs.length,
      successCount,
      failureCount,
      averageDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      uniqueUserCount: uniqueUsers.size,
      eventsByType,
      eventsBySeverity,
    };
  }

  // ==================== UTILITY OPERATIONS ====================

  async healthCheck(): Promise<{
    connected: boolean;
    database: string;
    collections: number;
  }> {
    try {
      await this.ensureConnection();

      // Simple round-trip to confirm the database is reachable.
      await prisma.$queryRaw`SELECT 1`;

      return {
        connected: true,
        database: "postgresql",
        collections: 0,
      };
    } catch {
      return { connected: false, database: "", collections: 0 };
    }
  }

  async runMigrations(): Promise<void> {
    await this.ensureConnection();

    // Indexes/schema are managed by Prisma migrations (`prisma migrate`),
    // so there is nothing to create here at runtime.
    console.log("✅ Database migrations are managed by Prisma");
  }
}

// Export singleton instance
export const dataService = DataService.getInstance();
