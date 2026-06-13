/**
 * Mission Ownership Verification System
 * Manages ownership, delegation, and access control for missions.
 *
 * Migrated from Mongoose to Prisma + Postgres: ownership records are upserted via
 * `prisma.missionOwnership.upsert` and read via `prisma.missionOwnership.find*`.
 * `delegatedTo`/`sharedWith`/`transferHistory` are stored as Json columns.
 */
import { Permission, Role, User, rbacManager } from "./rbac";
import { Prisma } from "@prisma/client";
import { prisma } from "~~/lib/prisma";

export interface MissionOwnership {
  missionId: string;
  ownerId: string;
  organizationId: string;
  createdAt: Date;
  delegatedTo: DelegatedAccess[];
  sharedWith: SharedAccess[];
  transferHistory: OwnershipTransfer[];
}

export interface DelegatedAccess {
  userId: string;
  permissions: Permission[];
  expiresAt?: Date;
  grantedBy: string;
  grantedAt: Date;
  reason?: string;
}

export interface SharedAccess {
  type: "user" | "organization" | "department" | "public";
  entityId?: string;
  permissions: Permission[];
  expiresAt?: Date;
  grantedBy: string;
  grantedAt: Date;
}

export interface OwnershipTransfer {
  fromUserId: string;
  toUserId: string;
  transferredBy: string;
  transferredAt: Date;
  reason: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export enum OwnershipAction {
  VIEW = "view",
  EDIT = "edit",
  DELETE = "delete",
  SHARE = "share",
  TRANSFER = "transfer",
  DELEGATE = "delegate",
  APPROVE = "approve",
  ARCHIVE = "archive",
  EXPORT = "export",
}

interface OwnershipCache {
  [key: string]: {
    ownership: MissionOwnership;
    cachedAt: Date;
  };
}

export class MissionOwnershipManager {
  private static instance: MissionOwnershipManager;
  private ownershipCache: OwnershipCache = {};
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): MissionOwnershipManager {
    if (!MissionOwnershipManager.instance) {
      MissionOwnershipManager.instance = new MissionOwnershipManager();
    }
    return MissionOwnershipManager.instance;
  }

  /**
   * Check if a user owns a mission
   */
  async isOwner(userId: string, missionId: string): Promise<boolean> {
    const ownership = await this.getMissionOwnership(missionId);
    return ownership?.ownerId === userId;
  }

  /**
   * Check if a user has access to perform an action on a mission
   */
  async canPerformAction(user: User, missionId: string, action: OwnershipAction): Promise<boolean> {
    // Super admins can do anything
    if (user.roles.includes(Role.SUPER_ADMIN)) {
      return true;
    }

    const ownership = await this.getMissionOwnership(missionId);
    if (!ownership) {
      return false;
    }

    // Check if user is the owner
    if (ownership.ownerId === user.id) {
      return true;
    }

    // Check organization-level access
    if (ownership.organizationId === user.organizationId) {
      // Organization admins have full access
      if (user.roles.includes(Role.ADMIN)) {
        return true;
      }

      // Mission managers in the same org have most permissions
      if (user.roles.includes(Role.MISSION_MANAGER)) {
        return action !== OwnershipAction.DELETE && action !== OwnershipAction.TRANSFER;
      }
    }

    // Check delegated access
    const delegation = ownership.delegatedTo.find(d => d.userId === user.id);
    if (delegation) {
      // Check if delegation has expired
      if (delegation.expiresAt && new Date() > delegation.expiresAt) {
        return false;
      }

      // Map action to required permission
      const requiredPermission = this.mapActionToPermission(action);
      return delegation.permissions.includes(requiredPermission);
    }

    // Check shared access
    const sharedAccess = this.findSharedAccess(ownership, user);
    if (sharedAccess) {
      // Check if sharing has expired
      if (sharedAccess.expiresAt && new Date() > sharedAccess.expiresAt) {
        return false;
      }

      // Map action to required permission
      const requiredPermission = this.mapActionToPermission(action);
      return sharedAccess.permissions.includes(requiredPermission);
    }

    // Check if user has general permission through RBAC
    const requiredPermission = this.mapActionToPermission(action);
    return rbacManager.hasPermission(user, requiredPermission);
  }

  /**
   * Create ownership record for a new mission
   */
  async createOwnership(missionId: string, ownerId: string, organizationId: string): Promise<MissionOwnership> {
    const ownership: MissionOwnership = {
      missionId,
      ownerId,
      organizationId,
      createdAt: new Date(),
      delegatedTo: [],
      sharedWith: [],
      transferHistory: [],
    };

    // Store in database (implementation depends on your database choice)
    await this.saveOwnership(ownership);

    // Cache the ownership
    this.cacheOwnership(missionId, ownership);

    return ownership;
  }

  /**
   * Delegate access to another user
   */
  async delegateAccess(
    missionId: string,
    delegatedBy: string,
    delegateTo: string,
    permissions: Permission[],
    expiresAt?: Date,
    reason?: string,
  ): Promise<DelegatedAccess> {
    const ownership = await this.getMissionOwnership(missionId);
    if (!ownership) {
      throw new Error("Mission not found");
    }

    // Verify the delegator has permission to delegate
    if (ownership.ownerId !== delegatedBy) {
      const delegator = { id: delegatedBy, email: "", roles: [], createdAt: new Date() } as User;
      const canDelegate = await this.canPerformAction(delegator, missionId, OwnershipAction.DELEGATE);
      if (!canDelegate) {
        throw new Error("User does not have permission to delegate access");
      }
    }

    const delegation: DelegatedAccess = {
      userId: delegateTo,
      permissions,
      expiresAt,
      grantedBy: delegatedBy,
      grantedAt: new Date(),
      reason,
    };

    // Remove any existing delegation for this user
    ownership.delegatedTo = ownership.delegatedTo.filter(d => d.userId !== delegateTo);
    ownership.delegatedTo.push(delegation);

    await this.saveOwnership(ownership);
    this.cacheOwnership(missionId, ownership);

    return delegation;
  }

  /**
   * Share mission with entity (user, organization, department, or public)
   */
  async shareMission(
    missionId: string,
    sharedBy: string,
    shareType: "user" | "organization" | "department" | "public",
    entityId: string | undefined,
    permissions: Permission[],
    expiresAt?: Date,
  ): Promise<SharedAccess> {
    const ownership = await this.getMissionOwnership(missionId);
    if (!ownership) {
      throw new Error("Mission not found");
    }

    // Verify the sharer has permission to share
    const sharer = { id: sharedBy, email: "", roles: [], createdAt: new Date() } as User;
    const canShare = await this.canPerformAction(sharer, missionId, OwnershipAction.SHARE);
    if (!canShare) {
      throw new Error("User does not have permission to share this mission");
    }

    const sharedAccess: SharedAccess = {
      type: shareType,
      entityId,
      permissions,
      expiresAt,
      grantedBy: sharedBy,
      grantedAt: new Date(),
    };

    ownership.sharedWith.push(sharedAccess);

    await this.saveOwnership(ownership);
    this.cacheOwnership(missionId, ownership);

    return sharedAccess;
  }

  /**
   * Transfer ownership of a mission
   */
  async transferOwnership(
    missionId: string,
    fromUserId: string,
    toUserId: string,
    transferredBy: string,
    reason: string,
    requiresApproval: boolean = true,
  ): Promise<OwnershipTransfer> {
    const ownership = await this.getMissionOwnership(missionId);
    if (!ownership) {
      throw new Error("Mission not found");
    }

    // Verify the transferrer has permission
    if (ownership.ownerId !== transferredBy && transferredBy !== fromUserId) {
      const transferrer = { id: transferredBy, roles: [Role.ADMIN] } as User;
      const canTransfer = await this.canPerformAction(transferrer, missionId, OwnershipAction.TRANSFER);
      if (!canTransfer) {
        throw new Error("User does not have permission to transfer ownership");
      }
    }

    const transfer: OwnershipTransfer = {
      fromUserId,
      toUserId,
      transferredBy,
      transferredAt: new Date(),
      reason,
      approved: !requiresApproval,
    };

    if (!requiresApproval) {
      // Immediate transfer
      ownership.ownerId = toUserId;
      transfer.approved = true;
      transfer.approvedBy = transferredBy;
      transfer.approvedAt = new Date();
    }

    ownership.transferHistory.push(transfer);

    await this.saveOwnership(ownership);
    this.cacheOwnership(missionId, ownership);

    return transfer;
  }

  /**
   * Revoke delegated access
   */
  async revokeDelegation(missionId: string, userId: string, revokedBy: string): Promise<void> {
    const ownership = await this.getMissionOwnership(missionId);
    if (!ownership) {
      throw new Error("Mission not found");
    }

    // Verify the revoker has permission
    if (ownership.ownerId !== revokedBy) {
      const revoker = { id: revokedBy, email: "", roles: [], createdAt: new Date() } as User;
      const canDelegate = await this.canPerformAction(revoker, missionId, OwnershipAction.DELEGATE);
      if (!canDelegate) {
        throw new Error("User does not have permission to revoke delegation");
      }
    }

    ownership.delegatedTo = ownership.delegatedTo.filter(d => d.userId !== userId);

    await this.saveOwnership(ownership);
    this.cacheOwnership(missionId, ownership);
  }

  /**
   * Get all missions owned by a user
   */
  async getMissionsOwnedBy(userId: string): Promise<string[]> {
    if (!this.isDbAvailable()) return [];

    const docs = await prisma.missionOwnership.findMany({
      where: { ownerId: userId },
      select: { missionId: true },
    });
    return docs.map(d => d.missionId);
  }

  /**
   * Get all missions accessible to a user (owned, delegated, or shared).
   */
  async getAccessibleMissions(user: User): Promise<string[]> {
    if (!this.isDbAvailable()) return [];

    const missions: Set<string> = new Set();

    const owned = await this.getMissionsOwnedBy(user.id);
    owned.forEach(m => missions.add(m));

    // delegatedTo/sharedWith are Json arrays, so the former nested-field /
    // $elemMatch queries can't be expressed as Prisma `where` clauses; load the
    // candidate rows and filter in JS.
    // TODO: optimize with JSONB query
    const rows = await prisma.missionOwnership.findMany({
      select: { missionId: true, delegatedTo: true, sharedWith: true },
    });

    for (const row of rows) {
      const delegatedTo = (row.delegatedTo as any[]) ?? [];
      if (delegatedTo.some(d => d.userId === user.id)) {
        missions.add(row.missionId);
        continue;
      }

      const sharedWith = (row.sharedWith as any[]) ?? [];
      const hasShare = sharedWith.some(s => {
        if (s.type === "public") return true;
        if (s.type === "user" && s.entityId === user.id) return true;
        if (s.type === "organization" && user.organizationId && s.entityId === user.organizationId) return true;
        if (s.type === "department" && user.departmentId && s.entityId === user.departmentId) return true;
        return false;
      });
      if (hasShare) {
        missions.add(row.missionId);
      }
    }

    return Array.from(missions);
  }

  /**
   * Map ownership action to required permission
   */
  private mapActionToPermission(action: OwnershipAction): Permission {
    const actionPermissionMap: Record<OwnershipAction, Permission> = {
      [OwnershipAction.VIEW]: Permission.MISSION_READ,
      [OwnershipAction.EDIT]: Permission.MISSION_UPDATE,
      [OwnershipAction.DELETE]: Permission.MISSION_DELETE,
      [OwnershipAction.SHARE]: Permission.MISSION_UPDATE,
      [OwnershipAction.TRANSFER]: Permission.MISSION_DELETE,
      [OwnershipAction.DELEGATE]: Permission.MISSION_UPDATE,
      [OwnershipAction.APPROVE]: Permission.MISSION_APPROVE,
      [OwnershipAction.ARCHIVE]: Permission.MISSION_ARCHIVE,
      [OwnershipAction.EXPORT]: Permission.MISSION_EXPORT,
    };

    return actionPermissionMap[action];
  }

  /**
   * Find shared access for a user
   */
  private findSharedAccess(ownership: MissionOwnership, user: User): SharedAccess | null {
    for (const share of ownership.sharedWith) {
      // Check user-specific shares
      if (share.type === "user" && share.entityId === user.id) {
        return share;
      }

      // Check organization shares
      if (share.type === "organization" && share.entityId === user.organizationId) {
        return share;
      }

      // Check department shares
      if (share.type === "department" && share.entityId === user.departmentId) {
        return share;
      }

      // Check public shares
      if (share.type === "public") {
        return share;
      }
    }

    return null;
  }

  /**
   * Get mission ownership from cache or database
   */
  private async getMissionOwnership(missionId: string): Promise<MissionOwnership | null> {
    // Check cache first
    const cached = this.ownershipCache[missionId];
    if (cached && Date.now() - cached.cachedAt.getTime() < this.cacheTimeout) {
      return cached.ownership;
    }

    // Load from database (implementation depends on your database choice)
    const ownership = await this.loadOwnership(missionId);

    if (ownership) {
      this.cacheOwnership(missionId, ownership);
    }

    return ownership;
  }

  /**
   * Cache ownership data
   */
  private cacheOwnership(missionId: string, ownership: MissionOwnership): void {
    this.ownershipCache[missionId] = {
      ownership,
      cachedAt: new Date(),
    };
  }

  /**
   * Whether durable storage (Prisma/Postgres) is usable in this context.
   *
   * Returns false in the browser or when no DATABASE_URL is configured, so non-DB
   * contexts fall back to the in-memory cache.
   */
  private isDbAvailable(): boolean {
    return typeof window === "undefined" && !!process.env.DATABASE_URL;
  }

  /**
   * Persist an ownership record (full upsert keyed by missionId).
   */
  private async saveOwnership(ownership: MissionOwnership): Promise<void> {
    if (!this.isDbAvailable()) return;

    const delegatedTo = ownership.delegatedTo as unknown as Prisma.InputJsonValue;
    const sharedWith = ownership.sharedWith as unknown as Prisma.InputJsonValue;
    const transferHistory = ownership.transferHistory as unknown as Prisma.InputJsonValue;

    await prisma.missionOwnership.upsert({
      where: { missionId: ownership.missionId },
      update: {
        ownerId: ownership.ownerId,
        organizationId: ownership.organizationId,
        createdAt: ownership.createdAt,
        delegatedTo,
        sharedWith,
        transferHistory,
      },
      create: {
        missionId: ownership.missionId,
        ownerId: ownership.ownerId,
        organizationId: ownership.organizationId,
        createdAt: ownership.createdAt,
        delegatedTo,
        sharedWith,
        transferHistory,
      },
    });
  }

  /**
   * Load an ownership record from the database.
   */
  private async loadOwnership(missionId: string): Promise<MissionOwnership | null> {
    if (!this.isDbAvailable()) return null;

    const doc = await prisma.missionOwnership.findUnique({ where: { missionId } });
    if (!doc) return null;

    return {
      missionId: doc.missionId,
      ownerId: doc.ownerId,
      organizationId: doc.organizationId as string,
      createdAt: doc.createdAt,
      delegatedTo: (doc.delegatedTo as any[]) || [],
      sharedWith: (doc.sharedWith as any[]) || [],
      transferHistory: (doc.transferHistory as any[]) || [],
    };
  }

  /**
   * Clear cache for a specific mission
   */
  clearCache(missionId: string): void {
    delete this.ownershipCache[missionId];
  }

  /**
   * Clear entire cache
   */
  clearAllCache(): void {
    this.ownershipCache = {};
  }
}

// Export singleton instance
export const ownershipManager = MissionOwnershipManager.getInstance();
