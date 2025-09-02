/**
 * Mock for permissions system - handles role-based access control
 */

// Define the constants directly to avoid import issues
const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  DEMO_ADMIN: 'demo_admin',
  COMPANY_ADMIN: 'company_admin', 
  TEAM_LEAD: 'team_lead',
  FRONTLINE_WORKER: 'frontline_worker',
};

const PERMISSIONS = {
  // Incident Management
  CREATE_INCIDENT: 'create_incident',
  EDIT_OWN_INCIDENT_CAPTURE: 'edit_own_incident_capture',
  VIEW_MY_INCIDENTS: 'view_my_incidents',
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
  
  // Audit and Security
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_SECURITY_LOGS: 'view_security_logs',
  IMPERSONATE_USERS: 'impersonate_users',
  
  // Testing and Development
  SAMPLE_DATA: 'sample_data',
};

// Mock the requirePermission function for security testing
const requirePermission = jest.fn(async (ctx, sessionToken, permission, options = {}) => {
  // Get user from session using mock resolver
  const user = ctx.mockSessionResolver?.[sessionToken];
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  // Check if permission is explicitly mocked
  const mockResult = ctx.db._getPermissionMockResult?.(user, permission);
  if (mockResult !== undefined) {
    if (!mockResult) {
      throw new Error('Insufficient permissions');
    }
  } else {
    // Default permission logic based on role
    const hasPermission = checkDefaultPermission(user.role, permission);
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }
  }
  
  return {
    user,
    correlationId: 'mock-correlation-' + Math.random().toString(36).substr(2, 9)
  };
});

// Simple role-based permission checking for default behavior
function checkDefaultPermission(role, permission) {
  const rolePermissions = {
    [ROLES.SYSTEM_ADMIN]: [
      PERMISSIONS.CREATE_INCIDENT,
      PERMISSIONS.VIEW_MY_INCIDENTS,
      PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
      PERMISSIONS.PERFORM_ANALYSIS,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.SYSTEM_CONFIGURATION,
    ],
    [ROLES.TEAM_LEAD]: [
      PERMISSIONS.CREATE_INCIDENT,
      PERMISSIONS.VIEW_MY_INCIDENTS,
      PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
      PERMISSIONS.PERFORM_ANALYSIS,
    ],
    [ROLES.FRONTLINE_WORKER]: [
      PERMISSIONS.CREATE_INCIDENT,
      PERMISSIONS.VIEW_MY_INCIDENTS,
      PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE,
    ]
  };
  
  return rolePermissions[role]?.includes(permission) || false;
}

module.exports = {
  PERMISSIONS,
  ROLES,
  requirePermission,
};