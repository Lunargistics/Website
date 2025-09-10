/**
 * Authentication and Authorization Middleware
 * Handles RBAC checks for API routes and pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rbacManager, Permission, User, Resource } from '@/lib/auth/rbac';

interface AuthConfig {
  publicPaths: string[];
  apiRoutePermissions: Map<string, Permission>;
  pagePermissions: Map<string, Permission>;
}

const authConfig: AuthConfig = {
  publicPaths: [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/api/auth',
    '/api/public',
  ],
  apiRoutePermissions: new Map([
    // Mission routes
    ['/api/missions', Permission.MISSION_READ],
    ['POST:/api/missions', Permission.MISSION_CREATE],
    ['PUT:/api/missions', Permission.MISSION_UPDATE],
    ['DELETE:/api/missions', Permission.MISSION_DELETE],
    
    // Equipment routes
    ['/api/equipment', Permission.EQUIPMENT_READ],
    ['POST:/api/equipment', Permission.EQUIPMENT_CREATE],
    ['PUT:/api/equipment', Permission.EQUIPMENT_UPDATE],
    ['DELETE:/api/equipment', Permission.EQUIPMENT_DELETE],
    
    // Compliance routes
    ['/api/compliance', Permission.COMPLIANCE_READ],
    ['POST:/api/compliance', Permission.COMPLIANCE_CREATE],
    ['PUT:/api/compliance', Permission.COMPLIANCE_UPDATE],
    ['/api/compliance/verify', Permission.COMPLIANCE_VERIFY],
    
    // Document routes
    ['/api/documents', Permission.DOCUMENT_READ],
    ['POST:/api/documents/generate', Permission.DOCUMENT_CREATE],
    ['PUT:/api/documents', Permission.DOCUMENT_UPDATE],
    ['DELETE:/api/documents', Permission.DOCUMENT_DELETE],
    
    // Orbit routes
    ['/api/orbit/propagate', Permission.ORBIT_CALCULATE],
    ['/api/orbit/optimize', Permission.ORBIT_OPTIMIZE],
    ['/api/constellation', Permission.CONSTELLATION_DESIGN],
    
    // IPFS routes
    ['/api/ipfs/upload', Permission.IPFS_UPLOAD],
    ['/api/ipfs/read', Permission.IPFS_READ],
    ['/api/ipfs/pin', Permission.IPFS_PIN],
    ['DELETE:/api/ipfs', Permission.IPFS_DELETE],
  ]),
  pagePermissions: new Map([
    ['/dashboard', Permission.MISSION_READ],
    ['/dashboard/missions', Permission.MISSION_READ],
    ['/dashboard/missions/create', Permission.MISSION_CREATE],
    ['/dashboard/equipment', Permission.EQUIPMENT_READ],
    ['/dashboard/compliance', Permission.COMPLIANCE_READ],
    ['/dashboard/analysis', Permission.ANALYSIS_RUN],
    ['/dashboard/admin', Permission.SYSTEM_ADMIN],
  ]),
};

export async function authMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Check if path is public
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Get user session
  const token = await getToken({ 
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET 
  });

  if (!token) {
    return unauthorizedResponse('Authentication required');
  }

  // Convert token to User object
  const user: User = {
    id: token.sub as string,
    email: token.email as string,
    roles: token.roles as any[] || [],
    permissions: token.permissions as Permission[] || [],
    organizationId: token.organizationId as string,
    createdAt: new Date(token.iat as number * 1000),
    lastLogin: new Date(),
  };

  // Check permissions for API routes
  if (pathname.startsWith('/api/')) {
    const permission = getRequiredPermission(pathname, method);
    if (permission && !rbacManager.hasPermission(user, permission)) {
      return forbiddenResponse(`Missing required permission: ${permission}`);
    }
  }

  // Check permissions for pages
  const pagePermission = authConfig.pagePermissions.get(pathname);
  if (pagePermission && !rbacManager.hasPermission(user, pagePermission)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Add user info to headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-email', user.email);
  requestHeaders.set('x-user-roles', user.roles.join(','));
  requestHeaders.set('x-organization-id', user.organizationId || '');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function isPublicPath(pathname: string): boolean {
  return authConfig.publicPaths.some(path => {
    if (path.endsWith('*')) {
      return pathname.startsWith(path.slice(0, -1));
    }
    return pathname === path;
  });
}

function getRequiredPermission(pathname: string, method: string): Permission | null {
  // Check method-specific permission first
  const methodPath = `${method}:${pathname}`;
  const methodPermission = authConfig.apiRoutePermissions.get(methodPath);
  if (methodPermission) {
    return methodPermission;
  }

  // Check general path permission
  const pathPermission = authConfig.apiRoutePermissions.get(pathname);
  if (pathPermission) {
    return pathPermission;
  }

  // Check wildcard paths
  for (const [pattern, permission] of authConfig.apiRoutePermissions.entries()) {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(pathname)) {
        return permission;
      }
    }
  }

  return null;
}

function unauthorizedResponse(message: string): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

function forbiddenResponse(message: string): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: message }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// Export for use in middleware.ts
export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};