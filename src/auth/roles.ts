/**
 * Role-Based Access Control (RBAC) System
 * Streamlined permission management for Sherlock Ω IDE with enterprise features
 * 
 * Features:
 * - User-provided streamlined 3-tier hierarchy (admin, developer, viewer)
 * - Comprehensive permissions for quantum computing and AI
 * - Git commit tracking for role changes
 * - OAuth and environment management integration
 * - Express.js middleware for route protection
 * - Enterprise team lifecycle management
 */

// Streamlined role hierarchy based on user requirements
export type UserRole = 'admin' | 'developer' | 'viewer';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: Date;
  lastActive: Date;
  permissions?: string[];
  metadata?: {
    department?: string;
    organization?: string;
    accessLevel?: 'basic' | 'advanced' | 'enterprise';
    quantumAccess?: boolean;
    aiAccess?: boolean;
  };
}

// ============================================================================
// Streamlined Role Permissions (User-Provided Configuration Enhanced)
// ============================================================================

// Core role permissions matching user requirements with enterprise enhancements
export const rolePermissions = {
  admin: [
    // User-provided core permissions
    'manage:users',
    'manage:secrets',
    'view:logs',
    'edit:code',
    'deploy:prod',
    
    // Enhanced enterprise permissions
    'manage:roles',
    'manage:security',
    'view:system-logs',
    'manage:infrastructure',
    'access:admin-panel',
    'execute:quantum-algorithms',
    'access:ai-assistant',
    'manage:oauth-credentials',
    'rotate:secrets',
    'audit:git-commits',
    'onboard:developers',
    'offboard:developers',
    'manage:team-access',
    'create:dev-environments',
    'cleanup:environments',
    
    // All quantum and AI permissions
    'execute:quantum',
    'manage:quantum-backends',
    'view:quantum-metrics',
    'configure:quantum-resources',
    'execute:ai',
    'manage:ai-models',
    'configure:ai-resources',
    'view:ai-metrics',
    
    // Full deployment and monitoring
    'deploy:staging',
    'deploy:dev',
    'view:metrics',
    'configure:monitoring',
    'export:data',
    'manage:integrations',
    'view:security-events',
    'configure:oauth'
  ],
  
  developer: [
    // User-provided core permissions
    'edit:code',
    'deploy:dev',
    'view:logs',
    
    // Enhanced development permissions
    'create:projects',
    'manage:dependencies',
    'execute:quantum-algorithms',
    'access:ai-assistant',
    'create:branches',
    'merge:pull-requests',
    'access:quantum-simulator',
    'train:ai-models',
    'access:code-generation',
    
    // Git and environment management
    'view:git-history',
    'track:commits',
    'inject:credentials',
    
    // Quantum computing access
    'execute:quantum',
    'view:quantum-metrics',
    'use:quantum-simulators',
    'create:quantum-circuits',
    
    // AI and ML access
    'execute:ai',
    'use:ai-models',
    'create:ai-workflows',
    'view:ai-metrics',
    
    // Collaboration
    'collaborate:real-time',
    'share:projects',
    'comment:code',
    'review:pull-requests',
    
    // Monitoring
    'view:own-metrics',
    'debug:own-code',
    'deploy:staging'
  ],
  
  viewer: [
    // User-provided core permissions
    'view:logs',
    'read:code',
    
    // Enhanced viewer permissions
    'read:documentation',
    'view:public-projects',
    'access:ui',
    'view:public-metrics',
    'view:tutorials',
    'learn:basics',
    'view:quantum-examples',
    'read:quantum-documentation',
    'view:ai-examples',
    'read:ai-documentation'
  ]
};

// ============================================================================
// Enhanced Utility Functions (User-Provided + Enterprise)
// ============================================================================

// Primary permission checker (user-provided implementation enhanced)
export function hasPermission(user: User, permission: string): boolean {
  if (!user || !user.role) {
    return false;
  }
  
  // User-provided logic: Check role permissions first
  const permissions = rolePermissions[user.role];
  if (permissions && permissions.includes(permission)) {
    return true;
  }
  
  // Check user-specific permissions (overrides)
  if (user.permissions?.includes(permission)) {
    return true;
  }
  
  return false;
}

// Enhanced permission checking functions
export function hasAllPermissions(user: User, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

export function hasAnyPermission(user: User, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

export function getUserPermissions(user: User): string[] {
  const rolePerms = rolePermissions[user.role] || [];
  const userPerms = user.permissions || [];
  return [...new Set([...rolePerms, ...userPerms])];
}

// Enhanced role upgrade utilities for streamlined hierarchy
export function canUpgradeRole(currentUser: User, targetRole: UserRole): boolean {
  if (!hasPermission(currentUser, 'manage:roles')) {
    return false;
  }
  
  // Streamlined role hierarchy: admin > developer > viewer
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    developer: 2,
    admin: 3
  };
  
  const currentLevel = roleHierarchy[currentUser.role];
  const targetLevel = roleHierarchy[targetRole];
  
  // Can only upgrade users to roles below your level
  return currentLevel > targetLevel;
}

// Enhanced feature access checks
export function canAccessQuantum(user: User): boolean {
  return hasAnyPermission(user, [
    'execute:quantum-algorithms',
    'execute:quantum',
    'use:quantum-simulators',
    'create:quantum-circuits'
  ]) && (user.metadata?.quantumAccess !== false);
}

export function canAccessAI(user: User): boolean {
  return hasAnyPermission(user, [
    'access:ai-assistant',
    'execute:ai',
    'use:ai-models',
    'create:ai-workflows'
  ]) && (user.metadata?.aiAccess !== false);
}

export function canManageUsers(user: User): boolean {
  return hasPermission(user, 'manage:users');
}

export function canDeployTo(user: User, environment: 'dev' | 'staging' | 'prod'): boolean {
  return hasPermission(user, `deploy:${environment}`);
}

// Permission middleware for Express routes
export function requirePermission(permission: string) {
  return (req: any, res: any, next: any) => {
    const user = req.user as User;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!hasPermission(user, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        userRole: user.role
      });
    }
    
    next();
  };
}

// Permission middleware for multiple permissions (ALL required)
export function requireAllPermissions(permissions: string[]) {
  return (req: any, res: any, next: any) => {
    const user = req.user as User;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!hasAllPermissions(user, permissions)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permissions,
        userRole: user.role
      });
    }
    
    next();
  };
}

// Role upgrade/downgrade utilities
export function canUpgradeRole(currentUser: User, targetRole: UserRole): boolean {
  if (!hasPermission(currentUser, 'manage:roles')) {
    return false;
  }
  
  // Role hierarchy: admin > researcher > developer > student > viewer
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    student: 2,
    developer: 3,
    researcher: 4,
    admin: 5
  };
  
  const currentLevel = roleHierarchy[currentUser.role];
  const targetLevel = roleHierarchy[targetRole];
  
  // Can only upgrade users to roles below your level
  return currentLevel > targetLevel;
}

// Enhanced example usage patterns (user-provided + enterprise):
/*
// Basic permission check (user-provided pattern)
if (!hasPermission(currentUser, 'manage:users')) { 
  throw new Error('Access denied') 
}

// Route protection with streamlined roles
app.get('/admin/users', requirePermission('manage:users'), (req, res) => {
  // Handle admin user management
});

// Multiple permissions for complex operations
app.post('/quantum/execute', requireAllPermissions(['execute:quantum-algorithms', 'create:quantum-circuits']), (req, res) => {
  // Handle quantum execution
});

// Feature access checks with streamlined roles
if (canAccessQuantum(user)) {
  // Show quantum features
}

if (canDeployTo(user, 'prod')) {
  // Show production deployment options
}

// OAuth and team management checks
if (hasPermission(user, 'manage:oauth-credentials')) {
  // Show OAuth management interface
}

if (hasPermission(user, 'onboard:developers')) {
  // Show developer onboarding tools
}
*/

export default {
  rolePermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getUserPermissions,
  canAccessQuantum,
  canAccessAI,
  canManageUsers,
  canDeployTo,
  requirePermission,
  requireAllPermissions,
  canUpgradeRole
};