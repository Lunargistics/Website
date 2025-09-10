/**
 * Role-Based Access Control (RBAC) System
 * Manages user roles, permissions, and access control for the Mission Planning Suite
 */

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MISSION_MANAGER = 'MISSION_MANAGER',
  ENGINEER = 'ENGINEER',
  ANALYST = 'ANALYST',
  AUDITOR = 'AUDITOR',
  VIEWER = 'VIEWER',
  GUEST = 'GUEST',
}

export enum Permission {
  // Mission Permissions
  MISSION_CREATE = 'mission:create',
  MISSION_READ = 'mission:read',
  MISSION_UPDATE = 'mission:update',
  MISSION_DELETE = 'mission:delete',
  MISSION_APPROVE = 'mission:approve',
  MISSION_ARCHIVE = 'mission:archive',
  MISSION_EXPORT = 'mission:export',

  // Equipment Permissions
  EQUIPMENT_CREATE = 'equipment:create',
  EQUIPMENT_READ = 'equipment:read',
  EQUIPMENT_UPDATE = 'equipment:update',
  EQUIPMENT_DELETE = 'equipment:delete',
  EQUIPMENT_MINT_NFT = 'equipment:mint_nft',

  // Standards & Compliance Permissions
  COMPLIANCE_CREATE = 'compliance:create',
  COMPLIANCE_READ = 'compliance:read',
  COMPLIANCE_UPDATE = 'compliance:update',
  COMPLIANCE_VERIFY = 'compliance:verify',
  COMPLIANCE_AUDIT = 'compliance:audit',

  // Document Permissions
  DOCUMENT_CREATE = 'document:create',
  DOCUMENT_READ = 'document:read',
  DOCUMENT_UPDATE = 'document:update',
  DOCUMENT_DELETE = 'document:delete',
  DOCUMENT_SIGN = 'document:sign',

  // Orbit & Analysis Permissions
  ORBIT_CALCULATE = 'orbit:calculate',
  ORBIT_OPTIMIZE = 'orbit:optimize',
  CONSTELLATION_DESIGN = 'constellation:design',
  ANALYSIS_RUN = 'analysis:run',
  ANALYSIS_EXPORT = 'analysis:export',

  // IPFS Permissions
  IPFS_UPLOAD = 'ipfs:upload',
  IPFS_READ = 'ipfs:read',
  IPFS_DELETE = 'ipfs:delete',
  IPFS_PIN = 'ipfs:pin',

  // Smart Contract Permissions
  CONTRACT_DEPLOY = 'contract:deploy',
  CONTRACT_INTERACT = 'contract:interact',
  CONTRACT_ADMIN = 'contract:admin',

  // System Permissions
  SYSTEM_ADMIN = 'system:admin',
  USER_MANAGE = 'user:manage',
  ROLE_MANAGE = 'role:manage',
  AUDIT_VIEW = 'audit:view',
  SETTINGS_MANAGE = 'settings:manage',
}

export enum Resource {
  MISSION = 'mission',
  EQUIPMENT = 'equipment',
  COMPLIANCE = 'compliance',
  DOCUMENT = 'document',
  ORBIT = 'orbit',
  IPFS = 'ipfs',
  CONTRACT = 'contract',
  SYSTEM = 'system',
}

interface RolePermissionMap {
  [Role.SUPER_ADMIN]: Permission[];
  [Role.ADMIN]: Permission[];
  [Role.MISSION_MANAGER]: Permission[];
  [Role.ENGINEER]: Permission[];
  [Role.ANALYST]: Permission[];
  [Role.AUDITOR]: Permission[];
  [Role.VIEWER]: Permission[];
  [Role.GUEST]: Permission[];
}

const rolePermissions: RolePermissionMap = {
  [Role.SUPER_ADMIN]: Object.values(Permission), // All permissions

  [Role.ADMIN]: [
    // All mission permissions
    Permission.MISSION_CREATE,
    Permission.MISSION_READ,
    Permission.MISSION_UPDATE,
    Permission.MISSION_DELETE,
    Permission.MISSION_APPROVE,
    Permission.MISSION_ARCHIVE,
    Permission.MISSION_EXPORT,
    // All equipment permissions
    Permission.EQUIPMENT_CREATE,
    Permission.EQUIPMENT_READ,
    Permission.EQUIPMENT_UPDATE,
    Permission.EQUIPMENT_DELETE,
    Permission.EQUIPMENT_MINT_NFT,
    // Compliance permissions
    Permission.COMPLIANCE_CREATE,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_UPDATE,
    Permission.COMPLIANCE_VERIFY,
    // Document permissions
    Permission.DOCUMENT_CREATE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_UPDATE,
    Permission.DOCUMENT_DELETE,
    Permission.DOCUMENT_SIGN,
    // Analysis permissions
    Permission.ORBIT_CALCULATE,
    Permission.ORBIT_OPTIMIZE,
    Permission.CONSTELLATION_DESIGN,
    Permission.ANALYSIS_RUN,
    Permission.ANALYSIS_EXPORT,
    // IPFS permissions
    Permission.IPFS_UPLOAD,
    Permission.IPFS_READ,
    Permission.IPFS_DELETE,
    Permission.IPFS_PIN,
    // Contract permissions
    Permission.CONTRACT_INTERACT,
    // System permissions
    Permission.USER_MANAGE,
    Permission.AUDIT_VIEW,
  ],

  [Role.MISSION_MANAGER]: [
    Permission.MISSION_CREATE,
    Permission.MISSION_READ,
    Permission.MISSION_UPDATE,
    Permission.MISSION_APPROVE,
    Permission.MISSION_EXPORT,
    Permission.EQUIPMENT_READ,
    Permission.EQUIPMENT_CREATE,
    Permission.EQUIPMENT_UPDATE,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_UPDATE,
    Permission.DOCUMENT_CREATE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_UPDATE,
    Permission.DOCUMENT_SIGN,
    Permission.ORBIT_CALCULATE,
    Permission.ORBIT_OPTIMIZE,
    Permission.CONSTELLATION_DESIGN,
    Permission.ANALYSIS_RUN,
    Permission.ANALYSIS_EXPORT,
    Permission.IPFS_UPLOAD,
    Permission.IPFS_READ,
    Permission.CONTRACT_INTERACT,
  ],

  [Role.ENGINEER]: [
    Permission.MISSION_READ,
    Permission.MISSION_UPDATE,
    Permission.EQUIPMENT_READ,
    Permission.EQUIPMENT_CREATE,
    Permission.EQUIPMENT_UPDATE,
    Permission.COMPLIANCE_READ,
    Permission.DOCUMENT_CREATE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_UPDATE,
    Permission.ORBIT_CALCULATE,
    Permission.ORBIT_OPTIMIZE,
    Permission.CONSTELLATION_DESIGN,
    Permission.ANALYSIS_RUN,
    Permission.ANALYSIS_EXPORT,
    Permission.IPFS_UPLOAD,
    Permission.IPFS_READ,
  ],

  [Role.ANALYST]: [
    Permission.MISSION_READ,
    Permission.EQUIPMENT_READ,
    Permission.COMPLIANCE_READ,
    Permission.DOCUMENT_READ,
    Permission.ORBIT_CALCULATE,
    Permission.ANALYSIS_RUN,
    Permission.ANALYSIS_EXPORT,
    Permission.IPFS_READ,
  ],

  [Role.AUDITOR]: [
    Permission.MISSION_READ,
    Permission.EQUIPMENT_READ,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_AUDIT,
    Permission.DOCUMENT_READ,
    Permission.AUDIT_VIEW,
    Permission.IPFS_READ,
  ],

  [Role.VIEWER]: [
    Permission.MISSION_READ,
    Permission.EQUIPMENT_READ,
    Permission.COMPLIANCE_READ,
    Permission.DOCUMENT_READ,
    Permission.IPFS_READ,
  ],

  [Role.GUEST]: [
    Permission.MISSION_READ,
    Permission.EQUIPMENT_READ,
  ],
};

export interface User {
  id: string;
  email: string;
  roles: Role[];
  permissions?: Permission[];
  organizationId?: string;
  departmentId?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AccessContext {
  user: User;
  resource: Resource;
  resourceId?: string;
  action: Permission;
  organizationId?: string;
  additionalContext?: Record<string, any>;
}

export class RBACManager {
  private static instance: RBACManager;
  private customPermissions: Map<string, Permission[]> = new Map();
  private roleHierarchy: Map<Role, Role[]> = new Map();

  private constructor() {
    this.initializeRoleHierarchy();
  }

  static getInstance(): RBACManager {
    if (!RBACManager.instance) {
      RBACManager.instance = new RBACManager();
    }
    return RBACManager.instance;
  }

  private initializeRoleHierarchy(): void {
    // Define role inheritance hierarchy
    this.roleHierarchy.set(Role.SUPER_ADMIN, [Role.ADMIN]);
    this.roleHierarchy.set(Role.ADMIN, [Role.MISSION_MANAGER]);
    this.roleHierarchy.set(Role.MISSION_MANAGER, [Role.ENGINEER]);
    this.roleHierarchy.set(Role.ENGINEER, [Role.ANALYST]);
    this.roleHierarchy.set(Role.ANALYST, [Role.VIEWER]);
    this.roleHierarchy.set(Role.VIEWER, [Role.GUEST]);
  }

  /**
   * Check if a user has a specific permission
   */
  hasPermission(user: User, permission: Permission): boolean {
    // Check direct user permissions first
    if (user.permissions?.includes(permission)) {
      return true;
    }

    // Check role-based permissions
    for (const role of user.roles) {
      if (this.roleHasPermission(role, permission)) {
        return true;
      }
    }

    // Check custom permissions
    const customPerms = this.customPermissions.get(user.id);
    if (customPerms?.includes(permission)) {
      return true;
    }

    return false;
  }

  /**
   * Check if a role has a specific permission
   */
  private roleHasPermission(role: Role, permission: Permission): boolean {
    // Check direct role permissions
    if (rolePermissions[role]?.includes(permission)) {
      return true;
    }

    // Check inherited permissions
    const inheritedRoles = this.roleHierarchy.get(role) || [];
    for (const inheritedRole of inheritedRoles) {
      if (this.roleHasPermission(inheritedRole, permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a user can access a specific resource
   */
  canAccess(context: AccessContext): boolean {
    const { user, action } = context;

    // Super admin can access everything
    if (user.roles.includes(Role.SUPER_ADMIN)) {
      return true;
    }

    // Check basic permission
    if (!this.hasPermission(user, action)) {
      return false;
    }

    // Additional organization-based checks
    if (context.organizationId && user.organizationId !== context.organizationId) {
      // User can only access resources in their organization
      // unless they have system admin permission
      return this.hasPermission(user, Permission.SYSTEM_ADMIN);
    }

    return true;
  }

  /**
   * Get all permissions for a user
   */
  getUserPermissions(user: User): Permission[] {
    const permissions = new Set<Permission>();

    // Add direct user permissions
    user.permissions?.forEach(p => permissions.add(p));

    // Add role-based permissions
    for (const role of user.roles) {
      this.getRolePermissions(role).forEach(p => permissions.add(p));
    }

    // Add custom permissions
    const customPerms = this.customPermissions.get(user.id);
    customPerms?.forEach(p => permissions.add(p));

    return Array.from(permissions);
  }

  /**
   * Get all permissions for a role (including inherited)
   */
  getRolePermissions(role: Role): Permission[] {
    const permissions = new Set<Permission>();

    // Add direct role permissions
    rolePermissions[role]?.forEach(p => permissions.add(p));

    // Add inherited permissions
    const inheritedRoles = this.roleHierarchy.get(role) || [];
    for (const inheritedRole of inheritedRoles) {
      this.getRolePermissions(inheritedRole).forEach(p => permissions.add(p));
    }

    return Array.from(permissions);
  }

  /**
   * Grant custom permission to a user
   */
  grantCustomPermission(userId: string, permission: Permission): void {
    const current = this.customPermissions.get(userId) || [];
    if (!current.includes(permission)) {
      current.push(permission);
      this.customPermissions.set(userId, current);
    }
  }

  /**
   * Revoke custom permission from a user
   */
  revokeCustomPermission(userId: string, permission: Permission): void {
    const current = this.customPermissions.get(userId) || [];
    const filtered = current.filter(p => p !== permission);
    this.customPermissions.set(userId, filtered);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(user: User, roles: Role[]): boolean {
    return roles.some(role => user.roles.includes(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(user: User, roles: Role[]): boolean {
    return roles.every(role => user.roles.includes(role));
  }

  /**
   * Get the highest role for a user
   */
  getHighestRole(user: User): Role | null {
    const roleOrder = [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.MISSION_MANAGER,
      Role.ENGINEER,
      Role.ANALYST,
      Role.AUDITOR,
      Role.VIEWER,
      Role.GUEST,
    ];

    for (const role of roleOrder) {
      if (user.roles.includes(role)) {
        return role;
      }
    }

    return null;
  }
}

// Export singleton instance
export const rbacManager = RBACManager.getInstance();

// Helper decorators for route protection
export function requiresPermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [req] = args;
      const user = req.user as User;

      if (!user || !rbacManager.hasPermission(user, permission)) {
        throw new Error(`Unauthorized: Missing permission ${permission}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export function requiresRole(role: Role) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [req] = args;
      const user = req.user as User;

      if (!user || !user.roles.includes(role)) {
        throw new Error(`Unauthorized: Missing role ${role}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}