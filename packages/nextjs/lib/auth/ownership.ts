/**
 * Mission Ownership Verification System
 * Manages ownership, delegation, and access control for missions
 */
import { Permission, Role, User, rbacManager } from "./rbac";

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
  async getMissionsOwnedBy(_userId: string): Promise<string[]> {
    // This would query your database
    // For now, returning empty array as placeholder
    return [];
  }

  /**
   * Get all missions accessible to a user
   */
  async getAccessibleMissions(user: User): Promise<string[]> {
    const missions: Set<string> = new Set();

    // Get owned missions
    const owned = await this.getMissionsOwnedBy(user.id);
    owned.forEach(m => missions.add(m));

    // Get delegated missions
    // This would query your database for all delegations to this user

    // Get shared missions
    // This would query your database for all shares to this user/org/dept

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
   * Save ownership to database (placeholder - implement based on your database)
   */
  private async saveOwnership(_ownership: MissionOwnership): Promise<void> {
    // TODO: Implement database save
    // This would save to MongoDB, PostgreSQL, etc.
  }

  /**
   * Load ownership from database (placeholder - implement based on your database)
   */
  private async loadOwnership(_missionId: string): Promise<MissionOwnership | null> {
    // TODO: Implement database load
    // This would load from MongoDB, PostgreSQL, etc.
    return null;
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
