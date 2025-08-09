'use client';

import { useAuth } from '../../components/auth/auth-provider';
import { LogoutButton } from '../../components/auth/logout-button';
import { PermissionTester } from '../../components/auth/permission-tester';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex-api';

// Role-based permission mapping for display
const ROLE_PERMISSIONS = {
  system_admin: [
    'Create incidents',
    'Edit own incident captures',
    'View team incidents',
    'View all company incidents',
    'Perform analysis',
    'Manage users',
    'Invite users',
    'View user profiles',
    'System configuration',
    'Company configuration',
    'Access LLM features',
    'View audit logs',
    'View security logs',
  ],
  company_admin: [
    'Create incidents',
    'Edit own incident captures',
    'View team incidents',
    'View all company incidents',
    'Perform analysis',
    'Manage users',
    'Invite users',
    'View user profiles',
    'Company configuration',
    'Access LLM features',
    'View audit logs',
  ],
  team_lead: [
    'Create incidents',
    'View team incidents',
    'Perform analysis',
    'View user profiles',
    'Access LLM features',
  ],
  frontline_worker: [
    'Create incidents',
    'Edit own incident captures',
  ],
};

const ROLE_DESCRIPTIONS = {
  system_admin: 'Complete system control across all companies and users. Can manage everything.',
  company_admin: 'Full control within their company. Can manage users and configure company settings.',
  team_lead: 'Incident management and analysis. Can oversee team incidents and perform detailed analysis.',
  frontline_worker: 'Basic incident reporting. Can create new incidents and edit them during capture phase.',
};

const TEST_SCENARIOS = {
  system_admin: [
    'Try accessing /admin area (should work)',
    'Test user management features',
    'Verify LLM access in chat',
    'Check cross-company access capabilities',
  ],
  company_admin: [
    'Try managing users in your company',
    'Test company configuration access',
    'Verify LLM access in chat',
    'Try viewing company-wide incidents',
  ],
  team_lead: [
    'Try creating a new incident',
    'Test incident analysis features',
    'Verify LLM access in chat',
    'Check team incident viewing',
  ],
  frontline_worker: [
    'Try creating a new incident',
    'Test editing your own incident',
    'Verify limited access (no admin features)',
    'Check that you cannot view team incidents',
  ],
};

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [permissions, setPermissions] = useState<string[]>([]);

  // Query user permissions from centralized permission system
  const userPermissions = useQuery(
    api.permissions.getUserPermissions,
    user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip'
  );

  // Query role-based permission labels from centralized registry
  const rolePermissionLabels = useQuery(
    api.permissions.getRolePermissionLabels,
    user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip'
  );

  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (rolePermissionLabels?.permissions) {
      // Use centralized permission registry for display
      setPermissions(rolePermissionLabels.permissions);
    } else if (userPermissions?.permissions) {
      // Fallback: convert permission keys to human-readable labels
      const permissionLabels = userPermissions.permissions.map(perm => {
        return perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      });
      setPermissions(permissionLabels);
    } else if (user && user.role) {
      // Final fallback to static permissions if all backend queries fail
      setPermissions(ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || []);
    }
  }, [rolePermissionLabels, userPermissions, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const roleColor = {
    system_admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
    company_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
    team_lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
    frontline_worker: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
  }[user.role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Home Navigation */}
        <div className="text-left mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <span className="mr-1">←</span>
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                User Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Role-based authentication system testing interface
              </p>
            </div>
            <LogoutButton />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Info */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Account Information
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
                  <dd>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColor}`}>
                      {user.role}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">LLM Access</dt>
                  <dd className="text-sm">
                    {user.has_llm_access ? (
                      <span className="text-green-600 dark:text-green-400">✓ Enabled</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">✗ Disabled</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Role Description */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Role Description
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {ROLE_DESCRIPTIONS[user.role as keyof typeof ROLE_DESCRIPTIONS] || 'Unknown role'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Your Permissions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {permissions.map((permission, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="text-green-500">✓</span>
                <span>{permission}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Permission Tester */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <PermissionTester />
        </div>

        {/* Testing Scenarios */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Testing Scenarios for Your Role
          </h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Recommended Tests for {user.role}:
            </h3>
            <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              {(TEST_SCENARIOS[user.role as keyof typeof TEST_SCENARIOS] || []).map((scenario, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{scenario}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.has_llm_access && (
              <Link
                href="/chat"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
              >
                💬 Test LLM Chat
              </Link>
            )}
            <Link
              href="/change-password"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
            >
              🔒 Change Password
            </Link>
            {(user.role === 'system_admin' || user.role === 'company_admin') && (
              <Link
                href="/admin"
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
              >
                ⚙️ Admin Panel
              </Link>
            )}
            <Link
              href="/debug-logs"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
            >
              📊 Debug Logs
            </Link>
            <Link
              href="/debug"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
            >
              🔍 Debug Tools
            </Link>
          </div>
        </div>

        {/* Test User Accounts */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            🧪 Test User Accounts
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Switch between different roles to test permissions:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries({
              'System Admin': 'system_admin@ndis.com.au',
              'Company Admin': 'company_admin@ndis.com.au',
              'Team Lead': 'team_lead@ndis.com.au',
              'Frontline Worker': 'frontline_worker@ndis.com.au',
            }).map(([roleName, email]) => (
              <div key={email} className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {roleName}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {email}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Password: <code>password</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}