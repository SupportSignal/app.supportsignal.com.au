/**
 * Centralized developer access control
 * Used by both DeveloperToolsBar and PromptTestingPanel
 */

interface User {
  role?: string;
  email?: string;
}

/**
 * Check if user has developer access to advanced tooling
 * @param user - User object with role and email
 * @returns boolean - true if user has developer access
 */
export function hasDeveloperAccess(user?: User | null): boolean {
  if (!user) return false;

  // Specific users granted developer access
  const allowedDeveloperEmails = [
    'angela@supportingpotential.com.au',
    'rony@kiros.com.au'
  ];

  return Boolean(
    // System administrators and demo admins
    user.role === 'system_admin' || 
    user.role === 'demo_admin' ||
    
    // Development environment: ideas-men.com.au emails
    (process.env.NODE_ENV === 'development' && user.email?.endsWith('@ideas-men.com.au')) ||
    
    // Specific whitelisted users
    (user.email && allowedDeveloperEmails.includes(user.email))
  );
}

/**
 * Check if user has sample data permissions (legacy name compatibility)
 * @deprecated Use hasDeveloperAccess instead
 */
export const hasSampleDataPermissions = hasDeveloperAccess;