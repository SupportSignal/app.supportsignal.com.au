'use client';

import { useQuery } from 'convex/react';
import { api } from '@/lib/convex-api';
import { useAuth } from './auth-provider';

// Fallback permissions for when backend is unavailable (kept minimal for emergency fallback)
const FALLBACK_TESTABLE_PERMISSIONS = [
  { key: 'create_incident', label: 'Create Incidents', description: 'Create new incident reports' },
  { key: 'manage_users', label: 'Manage Users', description: 'Add, edit, and manage users' },
  { key: 'system_configuration', label: 'System Configuration', description: 'Configure system-wide settings' },
  { key: 'sample_data', label: 'Sample Data', description: 'Access sample data for testing purposes' },
];

export function PermissionTester() {
  const { user } = useAuth();
  
  // Get testable permissions from centralized registry
  const testablePermissions = useQuery(
    api.permissions.getTestablePermissions,
    {}
  );
  
  // Get user's actual permissions
  const permissionResults = useQuery(
    api.permissions.getUserPermissions,
    user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip'
  );

  if (!user) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-gray-600 dark:text-gray-400">
          Please login to test permissions
        </p>
      </div>
    );
  }

  const hasPermission = (permission: string) => {
    if (!permissionResults?.permissions) return false;
    return (permissionResults.permissions as string[]).includes(permission);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        🧪 Permission Matrix
      </h3>
      
      <div className="space-y-4">
        {/* User Context Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Testing as: {user.name}
              </span>
              <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                {user.role.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            {permissionResults === undefined && (
              <div className="text-blue-600 dark:text-blue-400 text-sm">
                Loading permissions...
              </div>
            )}
          </div>
        </div>

        {/* Permission Table */}
        <div className="overflow-hidden border border-gray-200 dark:border-gray-600 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Permission
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Access
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {(testablePermissions?.permissions || FALLBACK_TESTABLE_PERMISSIONS).map((permission, index) => {
                const allowed = hasPermission(permission.key);
                const isLoading = permissionResults === undefined || testablePermissions === undefined;
                
                return (
                  <tr key={permission.key} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {permission.label}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {permission.description}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isLoading ? (
                        <div className="inline-flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                        </div>
                      ) : (
                        <div className="inline-flex items-center">
                          {allowed ? (
                            <div className="flex items-center text-green-600 dark:text-green-400">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="ml-1 text-xs font-medium">ALLOWED</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600 dark:text-red-400">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <span className="ml-1 text-xs font-medium">DENIED</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {permissionResults && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Permission Summary
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total Permissions:</span>
                <span className="ml-2 font-mono text-gray-900 dark:text-white">
                  {(testablePermissions?.permissions || FALLBACK_TESTABLE_PERMISSIONS).length}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Allowed:</span>
                <span className="ml-2 font-mono text-green-600 dark:text-green-400">
                  {(testablePermissions?.permissions || FALLBACK_TESTABLE_PERMISSIONS).filter(p => hasPermission(p.key)).length}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Denied:</span>
                <span className="ml-2 font-mono text-red-600 dark:text-red-400">
                  {(testablePermissions?.permissions || FALLBACK_TESTABLE_PERMISSIONS).filter(p => !hasPermission(p.key)).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}