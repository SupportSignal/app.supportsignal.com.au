/**
 * Role-based Permission System for SupportSignal
 * 
 * Implements hierarchical role-based access control with fine-grained permissions
 * for incident management workflows according to Story 1.3 requirements.
 * 
 * Permission Matrix:
 * - system_admin: Full system access including multi-tenant management
 * - company_admin: Full access within their company context  
 * - team_lead: Team management and incident analysis capabilities
 * - frontline_worker: Basic incident creation and editing (capture phase only)
 */

import { query, mutation, MutationCtx, QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { Id } from './_generated/dataModel';
import { getUserFromSession } from './lib/sessionResolver';

// Permission constants for type safety
export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  COMPANY_ADMIN: 'company_admin', 
  TEAM_LEAD: 'team_lead',
  FRONTLINE_WORKER: 'frontline_worker',
} as const;

export const PERMISSIONS = {
  // Incident Management
  CREATE_INCIDENT: 'create_incident',
  EDIT_OWN_INCIDENT_CAPTURE: 'edit_own_incident_capture',
  VIEW_TEAM_INCIDENTS: 'view_team_incidents',
  VIEW_ALL_COMPANY_INCIDENTS: 'view_all_company_incidents',
  PERFORM_ANALYSIS: 'perform_analysis',
  
  // User Management
  MANAGE_USERS: 'manage_users',
  INVITE_USERS: 'invite_users',
  VIEW_USER_PROFILES: 'view_user_profiles',
  
  // System Configuration
  SYSTEM_CONFIGURATION: 'system_configuration',
  COMPANY_CONFIGURATION: 'company_configuration',
  MANAGE_COMPANY: 'manage_company',
  
  // LLM Access Control
  ACCESS_LLM_FEATURES: 'access_llm_features',
  
  // Audit and Security
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_SECURITY_LOGS: 'view_security_logs',
  IMPERSONATE_USERS: 'impersonate_users',
  
  // Testing and Development
  SAMPLE_DATA: 'sample_data',
} as const;

// Enhanced Permission Registry with UI metadata
interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
  category: string;
  testable: boolean;
}

export const PERMISSION_REGISTRY: Record<string, PermissionDefinition> = {
  [PERMISSIONS.CREATE_INCIDENT]: {
    key: PERMISSIONS.CREATE_INCIDENT,
    label: 'Create Incidents',
    description: 'Create new incident reports',
    category: 'Incident Management',
    testable: true,
  },
  [PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE]: {
    key: PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE,
    label: 'Edit Own Incidents',
    description: 'Edit incident captures you created',
    category: 'Incident Management',
    testable: true,
  },
  [PERMISSIONS.VIEW_TEAM_INCIDENTS]: {
    key: PERMISSIONS.VIEW_TEAM_INCIDENTS,
    label: 'View Team Incidents',
    description: 'View incidents from your team',
    category: 'Incident Management',
    testable: true,
  },
  [PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS]: {
    key: PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
    label: 'View Company Incidents',
    description: 'View all company incidents',
    category: 'Incident Management',
    testable: true,
  },
  [PERMISSIONS.PERFORM_ANALYSIS]: {
    key: PERMISSIONS.PERFORM_ANALYSIS,
    label: 'Perform Analysis',
    description: 'Analyze incidents and generate insights',
    category: 'Incident Management',
    testable: true,
  },
  [PERMISSIONS.MANAGE_USERS]: {
    key: PERMISSIONS.MANAGE_USERS,
    label: 'Manage Users',
    description: 'Add, edit, and manage users',
    category: 'User Management',
    testable: true,
  },
  [PERMISSIONS.INVITE_USERS]: {
    key: PERMISSIONS.INVITE_USERS,
    label: 'Invite Users',
    description: 'Send user invitations',
    category: 'User Management',
    testable: true,
  },
  [PERMISSIONS.VIEW_USER_PROFILES]: {
    key: PERMISSIONS.VIEW_USER_PROFILES,
    label: 'View User Profiles',
    description: 'View detailed user information',
    category: 'User Management',
    testable: true,
  },
  [PERMISSIONS.SYSTEM_CONFIGURATION]: {
    key: PERMISSIONS.SYSTEM_CONFIGURATION,
    label: 'System Configuration',
    description: 'Configure system-wide settings',
    category: 'Configuration',
    testable: true,
  },
  [PERMISSIONS.COMPANY_CONFIGURATION]: {
    key: PERMISSIONS.COMPANY_CONFIGURATION,
    label: 'Company Configuration',
    description: 'Configure company settings',
    category: 'Configuration',
    testable: true,
  },
  [PERMISSIONS.MANAGE_COMPANY]: {
    key: PERMISSIONS.MANAGE_COMPANY,
    label: 'Manage Company',
    description: 'Update company information and settings',
    category: 'Configuration',
    testable: true,
  },
  [PERMISSIONS.ACCESS_LLM_FEATURES]: {
    key: PERMISSIONS.ACCESS_LLM_FEATURES,
    label: 'Access LLM Features',
    description: 'Use AI-powered features',
    category: 'AI & Analytics',
    testable: true,
  },
  [PERMISSIONS.VIEW_AUDIT_LOGS]: {
    key: PERMISSIONS.VIEW_AUDIT_LOGS,
    label: 'View Audit Logs',
    description: 'View system audit trails',
    category: 'Security & Audit',
    testable: true,
  },
  [PERMISSIONS.VIEW_SECURITY_LOGS]: {
    key: PERMISSIONS.VIEW_SECURITY_LOGS,
    label: 'View Security Logs',
    description: 'View security-related logs',
    category: 'Security & Audit',
    testable: true,
  },
  [PERMISSIONS.IMPERSONATE_USERS]: {
    key: PERMISSIONS.IMPERSONATE_USERS,
    label: 'Impersonate Users',
    description: 'Temporarily impersonate other users for testing and support',
    category: 'Security & Audit',
    testable: true,
  },
  [PERMISSIONS.SAMPLE_DATA]: {
    key: PERMISSIONS.SAMPLE_DATA,
    label: 'Sample Data',
    description: 'Access sample data for testing purposes',
    category: 'Testing & Development',
    testable: true,
  },
};

type Role = typeof ROLES[keyof typeof ROLES];
type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role hierarchy and permission mappings
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SYSTEM_ADMIN]: [
    PERMISSIONS.CREATE_INCIDENT,
    PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE,
    PERMISSIONS.VIEW_TEAM_INCIDENTS,
    PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
    PERMISSIONS.PERFORM_ANALYSIS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.INVITE_USERS,
    PERMISSIONS.VIEW_USER_PROFILES,
    PERMISSIONS.SYSTEM_CONFIGURATION,
    PERMISSIONS.COMPANY_CONFIGURATION,
    PERMISSIONS.MANAGE_COMPANY,
    PERMISSIONS.ACCESS_LLM_FEATURES,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_SECURITY_LOGS,
    PERMISSIONS.IMPERSONATE_USERS,
    PERMISSIONS.SAMPLE_DATA,
  ],
  [ROLES.COMPANY_ADMIN]: [
    PERMISSIONS.CREATE_INCIDENT,
    PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE,
    PERMISSIONS.VIEW_TEAM_INCIDENTS,
    PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
    PERMISSIONS.PERFORM_ANALYSIS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.INVITE_USERS,
    PERMISSIONS.VIEW_USER_PROFILES,
    PERMISSIONS.COMPANY_CONFIGURATION,
    PERMISSIONS.MANAGE_COMPANY,
    PERMISSIONS.ACCESS_LLM_FEATURES,
    PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  [ROLES.TEAM_LEAD]: [
    PERMISSIONS.CREATE_INCIDENT,
    PERMISSIONS.VIEW_TEAM_INCIDENTS,
    PERMISSIONS.PERFORM_ANALYSIS,
    PERMISSIONS.VIEW_USER_PROFILES,
    PERMISSIONS.ACCESS_LLM_FEATURES,
  ],
  [ROLES.FRONTLINE_WORKER]: [
    PERMISSIONS.CREATE_INCIDENT,
    PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE,
  ],
};

// Role hierarchy for inheritance (higher roles inherit from lower roles)
const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [ROLES.SYSTEM_ADMIN]: [ROLES.COMPANY_ADMIN, ROLES.TEAM_LEAD, ROLES.FRONTLINE_WORKER],
  [ROLES.COMPANY_ADMIN]: [ROLES.TEAM_LEAD, ROLES.FRONTLINE_WORKER],
  [ROLES.TEAM_LEAD]: [ROLES.FRONTLINE_WORKER],
  [ROLES.FRONTLINE_WORKER]: [],
};

/**
 * Check if a user has a specific permission
 */
export const checkPermission = query({
  args: {
    sessionToken: v.string(),
    permission: v.string(),
    resourceOwnerId: v.optional(v.id('users')), // For resource-specific permissions
    companyId: v.optional(v.id('companies')), // For company-scoped permissions
  },
  handler: async (ctx: QueryCtx, args) => {
    try {
      // Get user from session
      const user = await getUserFromSession(ctx, args.sessionToken);
      if (!user) {
        return {
          hasPermission: false,
          reason: 'Invalid or expired session',
          correlationId: generateCorrelationId(),
        };
      }

      // Check if user has the required permission
      const hasPermission = await hasUserPermission(
        ctx,
        user,
        args.permission as Permission,
        {
          resourceOwnerId: args.resourceOwnerId,
          companyId: args.companyId,
        }
      );

      const correlationId = generateCorrelationId();

      // Log permission check for audit trail
      await logPermissionCheck(ctx, {
        userId: user._id,
        permission: args.permission as Permission,
        granted: hasPermission,
        correlationId,
        resourceOwnerId: args.resourceOwnerId,
        companyId: args.companyId,
      });

      return {
        hasPermission,
        reason: hasPermission ? 'Permission granted' : 'Insufficient permissions',
        userRole: user.role,
        correlationId,
      };
    } catch (error) {
      console.error('Error checking permission:', error);
      return {
        hasPermission: false,
        reason: 'Permission check failed',
        correlationId: generateCorrelationId(),
      };
    }
  },
});

/**
 * Get all permissions for a user (for UI rendering)
 */
export const getUserPermissions = query({
  args: {
    sessionToken: v.string(),
    companyId: v.optional(v.id('companies')),
  },
  handler: async (ctx: QueryCtx, args) => {
    try {
      const user = await getUserFromSession(ctx, args.sessionToken);
      if (!user) {
        return {
          permissions: [],
          role: null,
          reason: 'Invalid or expired session',
        };
      }

      // Get base permissions for user role
      const rolePermissions = ROLE_PERMISSIONS[user.role as Role] || [];
      
      // Add inherited permissions from role hierarchy
      const inheritedPermissions = getInheritedPermissions(user.role as Role);
      const allPermissions = [...new Set([...rolePermissions, ...inheritedPermissions])];

      // Filter permissions based on context
      const contextualPermissions = await filterPermissionsByContext(ctx, user, allPermissions, {
        companyId: args.companyId,
      });

      return {
        permissions: contextualPermissions,
        role: user.role,
        companyId: user.company_id,
        reason: 'Success',
      };
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return {
        permissions: [],
        role: null,
        reason: 'Failed to get permissions',
      };
    }
  },
});

/**
 * Update user role (admin function)
 */
export const updateUserRole = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.id('users'),
    newRole: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    try {
      // Check if requester has permission to manage users
      const requester = await getUserFromSession(ctx, args.sessionToken);
      if (!requester) {
        throw new ConvexError('Invalid or expired session');
      }

      const canManageUsers = await hasUserPermission(ctx, requester, PERMISSIONS.MANAGE_USERS);
      if (!canManageUsers) {
        throw new ConvexError('Insufficient permissions to manage users');
      }

      // Validate new role
      if (!Object.values(ROLES).includes(args.newRole as Role)) {
        throw new ConvexError(`Invalid role: ${args.newRole}`);
      }

      // Get target user
      const targetUser = await ctx.db.get(args.targetUserId);
      if (!targetUser) {
        throw new ConvexError('Target user not found');
      }

      // Company admins can only manage users within their company
      if (requester.role === ROLES.COMPANY_ADMIN) {
        if (requester.company_id !== targetUser.company_id) {
          throw new ConvexError('Cannot manage users from different companies');
        }

        // Company admins cannot assign system_admin role
        if (args.newRole === ROLES.SYSTEM_ADMIN) {
          throw new ConvexError('Insufficient permissions to assign system admin role');
        }
      }

      const correlationId = generateCorrelationId();

      // Update user role
      await ctx.db.patch(args.targetUserId, {
        role: args.newRole as Role,
      });

      // Log role change for audit trail
      await logRoleChange(ctx, {
        requesterId: requester._id,
        targetUserId: args.targetUserId,
        oldRole: targetUser.role,
        newRole: args.newRole as Role,
        reason: args.reason || 'Role update',
        correlationId,
      });

      return {
        success: true,
        correlationId,
      };
    } catch (error) {
      console.error('Error updating user role:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to update user role: ${(error as Error).message}`);
    }
  },
});

/**
 * Create user invitation (admin function)
 */
export const createUserInvitation = mutation({
  args: {
    sessionToken: v.string(),
    email: v.string(),
    role: v.string(),
    companyId: v.optional(v.id('companies')),
    invitationMessage: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    try {
      // Check if requester can invite users
      const requester = await getUserFromSession(ctx, args.sessionToken);
      if (!requester) {
        throw new ConvexError('Invalid or expired session');
      }

      const canInviteUsers = await hasUserPermission(ctx, requester, PERMISSIONS.INVITE_USERS);
      if (!canInviteUsers) {
        throw new ConvexError('Insufficient permissions to invite users');
      }

      // Validate role
      if (!Object.values(ROLES).includes(args.role as Role)) {
        throw new ConvexError(`Invalid role: ${args.role}`);
      }

      // Check if user already exists
      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_email', q => q.eq('email', args.email))
        .first();

      if (existingUser) {
        throw new ConvexError('User with this email already exists');
      }

      // Generate secure invitation token
      const invitationToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      const correlationId = generateCorrelationId();

      // Create invitation record (this would be a new table)
      // For now, we'll log the invitation and return the token
      console.log('🎟️ USER INVITATION CREATED');
      console.log('==========================');
      console.log(`Email: ${args.email}`);
      console.log(`Role: ${args.role}`);
      console.log(`Company ID: ${args.companyId || 'Default'}`);
      console.log(`Token: ${invitationToken}`);
      console.log(`Expires: ${new Date(expiresAt).toISOString()}`);
      console.log(`Invited by: ${requester.email}`);
      console.log(`Correlation ID: ${correlationId}`);
      console.log(`Message: ${args.invitationMessage || 'Welcome to SupportSignal!'}`);
      console.log('==========================');

      // Log invitation creation
      await logSecurityEvent(ctx, {
        userId: requester._id,
        eventType: 'user_invitation_created',
        details: `Invited ${args.email} with role ${args.role}`,
        correlationId,
      });

      return {
        success: true,
        invitationToken, // In production, this would be sent via email
        expiresAt,
        correlationId,
      };
    } catch (error) {
      console.error('Error creating user invitation:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to create invitation: ${(error as Error).message}`);
    }
  },
});

// Helper Functions


/**
 * Check if user has specific permission
 */
async function hasUserPermission(
  ctx: QueryCtx, 
  user: any, 
  permission: Permission,
  context?: {
    resourceOwnerId?: Id<'users'>;
    companyId?: Id<'companies'>;
  }
): Promise<boolean> {
  const userRole = user.role as Role;
  
  // Get base permissions for user role
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  
  // Check direct permission
  if (rolePermissions.includes(permission)) {
    return true;
  }
  
  // Check inherited permissions
  const inheritedPermissions = getInheritedPermissions(userRole);
  if (inheritedPermissions.includes(permission)) {
    return true;
  }

  // Special cases for resource-specific permissions
  if (context?.resourceOwnerId && permission === PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE) {
    // Users can edit their own incidents during capture phase
    return context.resourceOwnerId === user._id;
  }

  // Company-scoped permissions
  if (context?.companyId && user.company_id === context.companyId) {
    // Users have enhanced permissions within their own company
    const companySpecificPermissions = getCompanySpecificPermissions(userRole);
    return companySpecificPermissions.includes(permission);
  }

  return false;
}

/**
 * Get inherited permissions from role hierarchy
 */
function getInheritedPermissions(role: Role): Permission[] {
  const inheritedRoles = ROLE_HIERARCHY[role] || [];
  const inheritedPermissions: Permission[] = [];
  
  for (const inheritedRole of inheritedRoles) {
    const permissions = ROLE_PERMISSIONS[inheritedRole] || [];
    inheritedPermissions.push(...permissions);
  }
  
  return [...new Set(inheritedPermissions)];
}

/**
 * Get company-specific permissions
 */
function getCompanySpecificPermissions(role: Role): Permission[] {
  // Users have additional permissions within their own company context
  switch (role) {
    case ROLES.TEAM_LEAD:
      return [PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS];
    case ROLES.FRONTLINE_WORKER:
      return [PERMISSIONS.VIEW_TEAM_INCIDENTS];
    default:
      return [];
  }
}

/**
 * Filter permissions based on context
 */
async function filterPermissionsByContext(
  ctx: QueryCtx,
  user: any,
  permissions: Permission[],
  context: { companyId?: Id<'companies'> }
): Promise<Permission[]> {
  // For now, return all permissions - in future could filter based on company context
  return permissions;
}

/**
 * Log permission check for audit trail
 */
async function logPermissionCheck(
  ctx: QueryCtx,
  data: {
    userId: Id<'users'>;
    permission: Permission;
    granted: boolean;
    correlationId: string;
    resourceOwnerId?: Id<'users'>;
    companyId?: Id<'companies'>;
  }
) {
  console.log('🔐 PERMISSION CHECK', {
    userId: data.userId,
    permission: data.permission,
    granted: data.granted,
    correlationId: data.correlationId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log role change for audit trail
 */
async function logRoleChange(
  ctx: MutationCtx,
  data: {
    requesterId: Id<'users'>;
    targetUserId: Id<'users'>;
    oldRole: string;
    newRole: Role;
    reason: string;
    correlationId: string;
  }
) {
  console.log('👤 ROLE CHANGE', {
    requesterId: data.requesterId,
    targetUserId: data.targetUserId,
    oldRole: data.oldRole,
    newRole: data.newRole,
    reason: data.reason,
    correlationId: data.correlationId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log security events for audit trail
 */
async function logSecurityEvent(
  ctx: QueryCtx | MutationCtx,
  data: {
    userId: Id<'users'>;
    eventType: string;
    details: string;
    correlationId: string;
  }
) {
  console.log('🛡️ SECURITY EVENT', {
    userId: data.userId,
    eventType: data.eventType,
    details: data.details,
    correlationId: data.correlationId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Generate correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get complete permission registry with UI metadata
 */
export const getPermissionRegistry = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    return {
      permissions: Object.values(PERMISSION_REGISTRY),
      correlationId: generateCorrelationId(),
    };
  },
});

/**
 * Get testable permissions for permission tester UI
 */
export const getTestablePermissions = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const testablePermissions = Object.values(PERMISSION_REGISTRY)
      .filter(p => p.testable)
      .sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));
    
    return {
      permissions: testablePermissions,
      correlationId: generateCorrelationId(),
    };
  },
});

/**
 * Get human-readable permission labels for a role
 */
export const getRolePermissionLabels = query({
  args: {
    sessionToken: v.string(),
    role: v.optional(v.string()), // If not provided, use current user's role
  },
  handler: async (ctx: QueryCtx, args) => {
    try {
      // Get user from session (for authentication)
      const user = await getUserFromSession(ctx, args.sessionToken);
      if (!user) {
        throw new ConvexError('Authentication required');
      }

      // Determine which role to get permissions for
      const targetRole = args.role || user.role;
      
      // Validate role
      if (!Object.values(ROLES).includes(targetRole as Role)) {
        throw new ConvexError(`Invalid role: ${targetRole}`);
      }

      // Get permissions for the role
      const rolePermissions = ROLE_PERMISSIONS[targetRole as Role] || [];
      
      // Convert to human-readable labels using the registry
      const permissionLabels = rolePermissions
        .map(permission => PERMISSION_REGISTRY[permission]?.label || permission)
        .sort();

      const correlationId = generateCorrelationId();

      return {
        role: targetRole,
        permissions: permissionLabels,
        permissionDetails: rolePermissions.map(p => PERMISSION_REGISTRY[p]).filter(Boolean),
        correlationId,
      };
    } catch (error) {
      console.error('Error getting role permission labels:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to get role permissions: ${(error as Error).message}`);
    }
  },
});

/**
 * Middleware helper for protecting mutations/queries
 * Usage: await requirePermission(ctx, sessionToken, PERMISSIONS.CREATE_INCIDENT);
 */
export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  sessionToken: string,
  permission: Permission,
  options?: {
    resourceOwnerId?: Id<'users'>;
    companyId?: Id<'companies'>;
    errorMessage?: string;
  }
): Promise<{ user: any; correlationId: string }> {
  const user = await getUserFromSession(ctx, sessionToken);
  if (!user) {
    throw new ConvexError('Authentication required');
  }

  const hasPermission = await hasUserPermission(ctx, user, permission, {
    resourceOwnerId: options?.resourceOwnerId,
    companyId: options?.companyId,
  });

  if (!hasPermission) {
    const correlationId = generateCorrelationId();
    
    // Log unauthorized access attempt
    await logSecurityEvent(ctx, {
      userId: user._id,
      eventType: 'unauthorized_access_attempt',
      details: `Attempted to access: ${permission}`,
      correlationId,
    });

    throw new ConvexError(options?.errorMessage || 'Insufficient permissions');
  }

  const correlationId = generateCorrelationId();
  
  // Log successful authorization
  await logPermissionCheck(ctx, {
    userId: user._id,
    permission,
    granted: true,
    correlationId,
    resourceOwnerId: options?.resourceOwnerId,
    companyId: options?.companyId,
  });

  return { user, correlationId };
}