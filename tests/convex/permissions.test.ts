/* @ts-nocheck */
/**
 * Role-Based Permission System Tests
 * 
 * Tests the comprehensive permission system including:
 * - Role hierarchy and inheritance
 * - Permission checking for different user types
 * - Company-scoped permissions
 * - Administrative functions (role updates, invitations)
 * - Security boundary enforcement
 */

import { ConvexTestingApi } from 'convex/testing';
import { api } from '../../apps/convex/_generated/api';
import schema from '../../apps/convex/schema';
import { beforeEach, describe, it, expect, afterEach } from '@jest/globals';

// Mock test setup
let testingApi: ConvexTestingApi<typeof schema>;

beforeEach(async () => {
  testingApi = new ConvexTestingApi(schema);
  await testingApi.run(async (ctx) => {
    // Clean up any existing data
    const users = await ctx.db.query('users').collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }
    
    const sessions = await ctx.db.query('sessions').collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    
    const companies = await ctx.db.query('companies').collect();
    for (const company of companies) {
      await ctx.db.delete(company._id);
    }
  });
});

afterEach(async () => {
  await testingApi.finishTest();
});

describe('Role-Based Permission System', () => {
  let companyId: string;
  let systemAdminSession: string;
  let companyAdminSession: string;
  let teamLeadSession: string;
  let frontlineWorkerSession: string;

  let systemAdminUser: any;
  let companyAdminUser: any;
  let teamLeadUser: any;
  let frontlineWorkerUser: any;

  beforeEach(async () => {
    // Create test company
    companyId = await testingApi.run(async (ctx) => {
      return await ctx.db.insert('companies', {
        name: 'Test Company',
        slug: 'test-company',
        contact_email: 'admin@testcompany.com',
        status: 'active',
        created_at: Date.now(),
      });
    });

    // Create users with different roles
    const userConfigs = [
      { email: 'system-admin@example.com', role: 'system_admin', name: 'System Admin' },
      { email: 'company-admin@example.com', role: 'company_admin', name: 'Company Admin' },
      { email: 'team-lead@example.com', role: 'team_lead', name: 'Team Lead' },
      { email: 'frontline@example.com', role: 'frontline_worker', name: 'Frontline Worker' },
    ];

    const sessions = [];
    const users = [];

    for (const config of userConfigs) {
      // Register user
      const registerResult = await testingApi.mutation(api.auth.registerUser, {
        name: config.name,
        email: config.email,
        password: 'SecurePass123!',
        company_id: companyId,
      });

      // Update role manually (would normally be done via invitation system)
      await testingApi.run(async (ctx) => {
        await ctx.db.patch(registerResult.userId, { role: config.role });
      });

      // Login to get session
      const loginResult = await testingApi.mutation(api.auth.loginUser, {
        email: config.email,
        password: 'SecurePass123!',
      });

      sessions.push(loginResult.sessionToken);
      users.push(loginResult.user);
    }

    // Assign sessions and users to variables
    [systemAdminSession, companyAdminSession, teamLeadSession, frontlineWorkerSession] = sessions;
    [systemAdminUser, companyAdminUser, teamLeadUser, frontlineWorkerUser] = users;
  });

  describe('Permission Checking', () => {
    it('should grant system admin all permissions', async () => {
      const permissions = [
        'create_incident',
        'view_team_incidents',
        'perform_analysis',
        'manage_users',
        'system_configuration',
        'cross_tenant_access',
        'access_llm_features',
        'view_audit_logs',
      ];

      for (const permission of permissions) {
        const result = await testingApi.query(api.permissions.checkPermission, {
          sessionToken: systemAdminSession,
          permission,
        });

        expect(result.hasPermission).toBe(true);
        expect(result.userRole).toBe('system_admin');
      }
    });

    it('should grant company admin appropriate permissions', async () => {
      const allowedPermissions = [
        'create_incident',
        'view_team_incidents',
        'perform_analysis',
        'manage_users',
        'company_configuration',
        'access_llm_features',
        'view_audit_logs',
      ];

      const deniedPermissions = [
        'system_configuration',
        'cross_tenant_access',
      ];

      for (const permission of allowedPermissions) {
        const result = await testingApi.query(api.permissions.checkPermission, {
          sessionToken: companyAdminSession,
          permission,
        });

        expect(result.hasPermission).toBe(true);
      }

      for (const permission of deniedPermissions) {
        const result = await testingApi.query(api.permissions.checkPermission, {
          sessionToken: companyAdminSession,
          permission,
        });

        expect(result.hasPermission).toBe(false);
      }
    });

    it('should grant team lead limited permissions', async () => {
      const allowedPermissions = [
        'create_incident',
        'view_team_incidents',
        'perform_analysis',
        'access_llm_features',
      ];

      const deniedPermissions = [
        'manage_users',
        'system_configuration',
        'company_configuration',
        'cross_tenant_access',
      ];

      for (const permission of allowedPermissions) {
        const result = await testingApi.query(api.permissions.checkPermission, {
          sessionToken: teamLeadSession,
          permission,
        });

        expect(result.hasPermission).toBe(true);
      }

      for (const permission of deniedPermissions) {
        const result = await testingApi.query(api.permissions.checkPermission, {
          sessionToken: teamLeadSession,
          permission,
        });

        expect(result.hasPermission).toBe(false);
      }
    });

    it('should grant frontline worker minimal permissions', async () => {
      const allowedPermissions = [
        'create_incident',
        'edit_own_incident_capture',
      ];

      const deniedPermissions = [
        'view_team_incidents',
        'perform_analysis',
        'manage_users',
        'system_configuration',
      ];

      for (const permission of allowedPermissions) {
        const result = await testingApi.query(api.permissions.checkPermission, {
          sessionToken: frontlineWorkerSession,
          permission,
        });

        expect(result.hasPermission).toBe(true);
      }

      for (const permission of deniedPermissions) {
        const result = await testingApi.query(api.permissions.checkPermission, {
          sessionToken: frontlineWorkerSession,
          permission,
        });

        expect(result.hasPermission).toBe(false);
      }
    });

    it('should grant viewer no default permissions', async () => {
      const deniedPermissions = [
        'create_incident',
        'view_team_incidents',
        'perform_analysis',
        'manage_users',
      ];

      for (const permission of deniedPermissions) {
        const result = await testingApi.query(api.permissions.checkPermission, {
          sessionToken: viewerSession,
          permission,
        });

        expect(result.hasPermission).toBe(false);
      }
    });

    it('should grant support cross-tenant access', async () => {
      const allowedPermissions = [
        'view_team_incidents',
        'view_all_company_incidents',
        'cross_tenant_access',
        'view_audit_logs',
      ];

      const deniedPermissions = [
        'manage_users',
        'system_configuration',
        'access_llm_features',
      ];

      for (const permission of allowedPermissions) {
        const result = await testingApi.query(api.permissions.checkPermission, {
          sessionToken: supportSession,
          permission,
        });

        expect(result.hasPermission).toBe(true);
      }

      for (const permission of deniedPermissions) {
        const result = await testingApi.query(api.permissions.checkPermission, {
          sessionToken: supportSession,
          permission,
        });

        expect(result.hasPermission).toBe(false);
      }
    });
  });

  describe('Resource-Specific Permissions', () => {
    it('should allow users to edit their own incidents during capture phase', async () => {
      const result = await testingApi.query(api.permissions.checkPermission, {
        sessionToken: frontlineWorkerSession,
        permission: 'edit_own_incident_capture',
        resourceOwnerId: frontlineWorkerUser.id,
      });

      expect(result.hasPermission).toBe(true);
    });

    it('should deny users from editing other users incidents', async () => {
      const result = await testingApi.query(api.permissions.checkPermission, {
        sessionToken: frontlineWorkerSession,
        permission: 'edit_own_incident_capture',
        resourceOwnerId: teamLeadUser.id, // Different user
      });

      expect(result.hasPermission).toBe(false);
    });

    it('should allow company-scoped permissions within same company', async () => {
      const result = await testingApi.query(api.permissions.checkPermission, {
        sessionToken: teamLeadSession,
        permission: 'view_all_company_incidents',
        companyId,
      });

      expect(result.hasPermission).toBe(true);
    });
  });

  describe('User Permission Lists', () => {
    it('should return correct permission list for system admin', async () => {
      const result = await testingApi.query(api.permissions.getUserPermissions, {
        sessionToken: systemAdminSession,
      });

      expect(result.role).toBe('system_admin');
      expect(result.permissions).toContain('manage_users');
      expect(result.permissions).toContain('system_configuration');
      expect(result.permissions).toContain('cross_tenant_access');
      expect(result.permissions.length).toBeGreaterThan(10);
    });

    it('should return correct permission list for company admin', async () => {
      const result = await testingApi.query(api.permissions.getUserPermissions, {
        sessionToken: companyAdminSession,
      });

      expect(result.role).toBe('company_admin');
      expect(result.permissions).toContain('manage_users');
      expect(result.permissions).toContain('company_configuration');
      expect(result.permissions).not.toContain('system_configuration');
      expect(result.permissions).not.toContain('cross_tenant_access');
    });

    it('should return minimal permissions for viewer', async () => {
      const result = await testingApi.query(api.permissions.getUserPermissions, {
        sessionToken: viewerSession,
      });

      expect(result.role).toBe('viewer');
      expect(result.permissions).toEqual([]);
    });
  });

  describe('Administrative Functions', () => {
    describe('Role Updates', () => {
      it('should allow system admin to update any user role', async () => {
        const result = await testingApi.mutation(api.permissions.updateUserRole, {
          sessionToken: systemAdminSession,
          targetUserId: viewerUser.id,
          newRole: 'frontline_worker',
          reason: 'Promotion test',
        });

        expect(result.success).toBe(true);

        // Verify role was updated
        const updatedUser = await testingApi.run(async (ctx) => {
          return await ctx.db.get(viewerUser.id);
        });
        expect(updatedUser?.role).toBe('frontline_worker');
      });

      it('should allow company admin to update users within their company', async () => {
        const result = await testingApi.mutation(api.permissions.updateUserRole, {
          sessionToken: companyAdminSession,
          targetUserId: viewerUser.id,
          newRole: 'team_lead',
          reason: 'Promotion within company',
        });

        expect(result.success).toBe(true);
      });

      it('should prevent company admin from assigning system_admin role', async () => {
        await expect(
          testingApi.mutation(api.permissions.updateUserRole, {
            sessionToken: companyAdminSession,
            targetUserId: viewerUser.id,
            newRole: 'system_admin',
          })
        ).rejects.toThrow('Insufficient permissions to assign system admin role');
      });

      it('should prevent non-admin users from updating roles', async () => {
        await expect(
          testingApi.mutation(api.permissions.updateUserRole, {
            sessionToken: teamLeadSession,
            targetUserId: viewerUser.id,
            newRole: 'frontline_worker',
          })
        ).rejects.toThrow('Insufficient permissions to manage users');
      });

      it('should validate role values', async () => {
        await expect(
          testingApi.mutation(api.permissions.updateUserRole, {
            sessionToken: systemAdminSession,
            targetUserId: viewerUser.id,
            newRole: 'invalid_role',
          })
        ).rejects.toThrow('Invalid role: invalid_role');
      });
    });

    describe('User Invitations', () => {
      it('should allow system admin to create invitations', async () => {
        const result = await testingApi.mutation(api.permissions.createUserInvitation, {
          sessionToken: systemAdminSession,
          email: 'newuser@example.com',
          role: 'team_lead',
          companyId,
          invitationMessage: 'Welcome to the team!',
        });

        expect(result.success).toBe(true);
        expect(result.invitationToken).toBeDefined();
        expect(result.expiresAt).toBeGreaterThan(Date.now());
      });

      it('should allow company admin to create invitations', async () => {
        const result = await testingApi.mutation(api.permissions.createUserInvitation, {
          sessionToken: companyAdminSession,
          email: 'newmember@example.com',
          role: 'frontline_worker',
          companyId,
        });

        expect(result.success).toBe(true);
      });

      it('should prevent non-admin users from creating invitations', async () => {
        await expect(
          testingApi.mutation(api.permissions.createUserInvitation, {
            sessionToken: teamLeadSession,
            email: 'unauthorized@example.com',
            role: 'viewer',
          })
        ).rejects.toThrow('Insufficient permissions to invite users');
      });

      it('should prevent invitation for existing email', async () => {
        await expect(
          testingApi.mutation(api.permissions.createUserInvitation, {
            sessionToken: systemAdminSession,
            email: viewerUser.email, // Existing user email
            role: 'team_lead',
          })
        ).rejects.toThrow('User with this email already exists');
      });

      it('should validate role in invitations', async () => {
        await expect(
          testingApi.mutation(api.permissions.createUserInvitation, {
            sessionToken: systemAdminSession,
            email: 'newuser@example.com',
            role: 'invalid_role',
          })
        ).rejects.toThrow('Invalid role: invalid_role');
      });
    });
  });

  describe('Security Boundary Enforcement', () => {
    it('should fail permission checks with invalid session', async () => {
      const result = await testingApi.query(api.permissions.checkPermission, {
        sessionToken: 'invalid-token',
        permission: 'create_incident',
      });

      expect(result.hasPermission).toBe(false);
      expect(result.reason).toBe('Invalid or expired session');
    });

    it('should fail permission checks with expired session', async () => {
      // Create expired session manually
      const expiredSessionId = await testingApi.run(async (ctx) => {
        return await ctx.db.insert('sessions', {
          userId: viewerUser.id,
          sessionToken: 'expired-token',
          expires: Date.now() - 1000, // Expired 1 second ago
          rememberMe: false,
        });
      });

      const result = await testingApi.query(api.permissions.checkPermission, {
        sessionToken: 'expired-token',
        permission: 'create_incident',
      });

      expect(result.hasPermission).toBe(false);
      expect(result.reason).toBe('Invalid or expired session');
    });

    it('should log permission checks for audit trail', async () => {
      // Permission checks should generate correlation IDs for audit logging
      const result = await testingApi.query(api.permissions.checkPermission, {
        sessionToken: systemAdminSession,
        permission: 'manage_users',
      });

      expect(result.correlationId).toBeDefined();
      expect(result.correlationId).toMatch(/^[a-f0-9]{32}$/); // 32 hex characters
    });

    it('should handle cross-company permission boundaries', async () => {
      // Create second company and user
      const company2Id = await testingApi.run(async (ctx) => {
        return await ctx.db.insert('companies', {
          name: 'Second Company',
          slug: 'second-company',
          contact_email: 'admin@second.com',
          status: 'active',
          created_at: Date.now(),
        });
      });

      // Register user in second company
      const registerResult = await testingApi.mutation(api.auth.registerUser, {
        name: 'Second Company Admin',
        email: 'second-admin@example.com',
        password: 'SecurePass123!',
        company_id: company2Id,
      });

      await testingApi.run(async (ctx) => {
        await ctx.db.patch(registerResult.userId, { role: 'company_admin' });
      });

      const loginResult = await testingApi.mutation(api.auth.loginUser, {
        email: 'second-admin@example.com',
        password: 'SecurePass123!',
      });

      // Second company admin should not be able to manage users from first company
      await expect(
        testingApi.mutation(api.permissions.updateUserRole, {
          sessionToken: loginResult.sessionToken,
          targetUserId: viewerUser.id, // User from first company
          newRole: 'team_lead',
        })
      ).rejects.toThrow('Cannot manage users from different companies');
    });
  });

  describe('Role Hierarchy and Inheritance', () => {
    it('should inherit permissions correctly through hierarchy', async () => {
      // System admin should inherit all lower role permissions
      const systemAdminPermissions = await testingApi.query(api.permissions.getUserPermissions, {
        sessionToken: systemAdminSession,
      });

      // Company admin permissions should be subset of system admin
      const companyAdminPermissions = await testingApi.query(api.permissions.getUserPermissions, {
        sessionToken: companyAdminSession,
      });

      // Check that company admin permissions are included in system admin permissions
      for (const permission of companyAdminPermissions.permissions) {
        expect(systemAdminPermissions.permissions).toContain(permission);
      }
    });

    it('should handle special support role permissions', async () => {
      // Support role should have cross-tenant access but not management permissions
      const supportPermissions = await testingApi.query(api.permissions.getUserPermissions, {
        sessionToken: supportSession,
      });

      expect(supportPermissions.permissions).toContain('cross_tenant_access');
      expect(supportPermissions.permissions).toContain('view_audit_logs');
      expect(supportPermissions.permissions).not.toContain('manage_users');
      expect(supportPermissions.permissions).not.toContain('system_configuration');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null/undefined session tokens gracefully', async () => {
      const result = await testingApi.query(api.permissions.checkPermission, {
        sessionToken: '',
        permission: 'create_incident',
      });

      expect(result.hasPermission).toBe(false);
      expect(result.reason).toBe('Invalid or expired session');
    });

    it('should handle invalid permission names', async () => {
      const result = await testingApi.query(api.permissions.checkPermission, {
        sessionToken: systemAdminSession,
        permission: 'nonexistent_permission',
      });

      // Should not throw error, but should deny permission
      expect(result.hasPermission).toBe(false);
    });

    it('should handle deleted users gracefully', async () => {
      // Delete user but keep session
      await testingApi.run(async (ctx) => {
        await ctx.db.delete(viewerUser.id);
      });

      const result = await testingApi.query(api.permissions.checkPermission, {
        sessionToken: viewerSession,
        permission: 'create_incident',
      });

      expect(result.hasPermission).toBe(false);
      expect(result.reason).toBe('Invalid or expired session');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle permission checks efficiently', async () => {
      const startTime = Date.now();
      
      // Perform multiple permission checks
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          testingApi.query(api.permissions.checkPermission, {
            sessionToken: systemAdminSession,
            permission: 'create_incident',
          })
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // All should succeed
      for (const result of results) {
        expect(result.hasPermission).toBe(true);
      }

      // Should complete in reasonable time (less than 1 second for 10 checks)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should cache permission calculations appropriately', async () => {
      // Multiple identical permission checks should be consistent
      const results = await Promise.all([
        testingApi.query(api.permissions.getUserPermissions, { sessionToken: systemAdminSession }),
        testingApi.query(api.permissions.getUserPermissions, { sessionToken: systemAdminSession }),
        testingApi.query(api.permissions.getUserPermissions, { sessionToken: systemAdminSession }),
      ]);

      // All results should be identical
      expect(results[0].permissions).toEqual(results[1].permissions);
      expect(results[1].permissions).toEqual(results[2].permissions);
      expect(results[0].role).toBe(results[1].role);
      expect(results[1].role).toBe(results[2].role);
    });
  });
});

// Helper functions for test data generation
function generateTestRole() {
  const roles = ['system_admin', 'company_admin', 'team_lead', 'frontline_worker', 'viewer', 'support'];
  return roles[Math.floor(Math.random() * roles.length)];
}

function generateTestPermission() {
  const permissions = [
    'create_incident',
    'view_team_incidents',
    'perform_analysis',
    'manage_users',
    'system_configuration',
    'access_llm_features',
  ];
  return permissions[Math.floor(Math.random() * permissions.length)];
}