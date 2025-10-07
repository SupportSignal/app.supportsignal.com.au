/**
 * Centralized Route Definitions
 *
 * Single source of truth for all application routes.
 *
 * Benefits:
 * - Type-safe route references
 * - Easy to grep and analyze
 * - Prevents typos and broken links
 * - IDE autocomplete support
 * - Centralized route changes
 *
 * Usage:
 * ```typescript
 * import { ROUTES } from '@/lib/routes';
 *
 * // Static routes
 * <Link href={ROUTES.admin.dashboard}>Admin</Link>
 *
 * // Dynamic routes
 * router.push(ROUTES.auth.resetPassword(token));
 * ```
 */

export const ROUTES = {
  // Public routes
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',

  // Auth callbacks
  auth: {
    github: '/auth/github/callback',
    google: '/auth/google/callback',
    resetPassword: (token: string) => `/reset-password?token=${token}`,
  },

  // Dashboard routes
  dashboard: '/dashboard',
  newIncident: '/new-incident',
  participants: '/participants',
  protected: '/protected',
  changePassword: '/change-password',

  // Admin routes
  admin: {
    root: '/admin',
    analytics: '/admin/analytics',
    users: '/admin/users',
    tools: '/admin/tools',
    impersonation: '/admin/impersonation',
    companies: {
      root: '/admin/companies',
      create: '/admin/companies/create',
    },
    companySettings: '/admin/company-settings',
    aiPrompts: '/admin/ai-prompts',
  },

  // Company Management
  companyManagement: '/company-management',

  // Reports
  reports: '/reports',
  users: '/users',

  // Developer/Debug routes
  dev: '/dev',
  debug: '/debug',
  debugLogs: '/debug-logs',
  showcase: '/showcase',
  wizardDemo: '/wizard-demo',

  // API routes (for reference, not for Link components)
  api: {
    debugEnv: '/api/debug-env',
    redisStats: '/api/redis-stats',
  },
} as const;

/**
 * Type-safe route helper for dynamic routes
 *
 * Example:
 * ```typescript
 * const resetUrl = ROUTES.auth.resetPassword('abc123');
 * // Returns: '/reset-password?token=abc123'
 * ```
 */
export type RouteKey = keyof typeof ROUTES;

/**
 * Check if a route path matches a defined route
 * Useful for active link detection
 */
export function isActiveRoute(currentPath: string, route: string): boolean {
  return currentPath === route || currentPath.startsWith(`${route}/`);
}
