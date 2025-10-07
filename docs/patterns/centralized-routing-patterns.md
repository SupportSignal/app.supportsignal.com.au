# Centralized Routing Patterns

*Source: Story 0.4 Phase 1 - Route Management Implementation*
*Last Updated: October 7, 2025*

## Overview

This document captures the centralized routing pattern established in Story 0.4, eliminating hardcoded route strings and providing type-safe route definitions with IDE autocomplete support.

## The Problem: Scattered Route Definitions

### Anti-Pattern: Hardcoded Route Strings

**Problem Identified**: Routes defined inconsistently across 3 different patterns:

**Pattern 1 - JSX String Attributes** (most common):
```typescript
<Link href="/admin/analytics">Analytics</Link>
<Link href="/admin/companies/create">Create Company</Link>
```

**Pattern 2 - Object Properties**:
```typescript
const navigationItems = [
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/users', label: 'Users' },
];
```

**Pattern 3 - Template Literals**:
```typescript
const resetUrl = `${config.baseUrl}/reset-password?token=${token}`;
router.push(`/admin/companies/${companyId}`);
```

**Impact**:
- **72% false positive rate** in route analysis tools
- Typos not caught until runtime
- Refactoring routes requires search/replace across entire codebase
- No IDE autocomplete for routes
- No type safety for dynamic routes

**Real Examples from Codebase**:
```typescript
// apps/web/app/admin/page.tsx
<Link href="/admin/analytics">Analytics</Link>

// apps/web/components/navigation.tsx
{ href: '/admin/analytics', label: 'Analytics' }

// apps/web/lib/email-templates.ts
const resetUrl = `${baseUrl}/reset-password?token=${token}`;
```

## The Solution: Centralized Routes Object

### Pattern: Single Source of Truth

**Implementation**: Create `apps/web/lib/routes.ts` with all route definitions.

```typescript
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
```

### Benefits of This Pattern

**1. Type Safety**:
```typescript
// ✅ TypeScript validates route exists
<Link href={ROUTES.admin.analytics} />

// ❌ Typo caught at compile time
<Link href={ROUTES.admin.anaytics} />  // Property 'anaytics' does not exist
```

**2. IDE Autocomplete**:
```typescript
// Type "ROUTES.admin." and get full list:
ROUTES.admin.
  // ├─ root
  // ├─ analytics
  // ├─ users
  // ├─ companies
  // └─ ...
```

**3. Easy Refactoring**:
```typescript
// Change route in ONE place:
admin: {
  analytics: '/admin/analytics',  // Change to '/admin/stats'
}

// All usages automatically updated
```

**4. Dynamic Routes with Type Safety**:
```typescript
// Helper function ensures correct parameter types
auth: {
  resetPassword: (token: string) => `/reset-password?token=${token}`,
}

// Usage
const url = ROUTES.auth.resetPassword(token);  // ✅ Type-safe
const url = ROUTES.auth.resetPassword(123);    // ❌ Type error: number not assignable to string
```

**5. Easy to Analyze**:
```bash
# Find all routes:
cat apps/web/lib/routes.ts

# Find usage of specific route:
grep -r "ROUTES.admin.analytics" apps/

# Much easier than:
grep -r '"/admin/analytics"' apps/  # Misses template literals and variations
```

## Usage Patterns

### Pattern: Static Routes

**Before**:
```typescript
// Hardcoded string - easy to typo
<Link href="/admin/companies/create">Create Company</Link>
```

**After**:
```typescript
import { ROUTES } from '@/lib/routes';

// Type-safe constant
<Link href={ROUTES.admin.companies.create}>Create Company</Link>
```

### Pattern: Dynamic Routes with Parameters

**Before**:
```typescript
// Template literal - no type safety
const resetUrl = `${baseUrl}/reset-password?token=${token}`;
```

**After**:
```typescript
import { ROUTES } from '@/lib/routes';

// Helper function with type-safe parameters
const resetUrl = ROUTES.auth.resetPassword(token);
```

### Pattern: Nested Route Objects

**Before**:
```typescript
// Flat structure - no organization
const ROUTES = {
  adminRoot: '/admin',
  adminAnalytics: '/admin/analytics',
  adminUsers: '/admin/users',
  adminCompanies: '/admin/companies',
  adminCompaniesCreate: '/admin/companies/create',
};
```

**After**:
```typescript
// Nested structure - logical grouping
const ROUTES = {
  admin: {
    root: '/admin',
    analytics: '/admin/analytics',
    users: '/admin/users',
    companies: {
      root: '/admin/companies',
      create: '/admin/companies/create',
    },
  },
};

// Usage: ROUTES.admin.companies.create
```

### Pattern: Active Route Detection

**Implementation**:
```typescript
export function isActiveRoute(currentPath: string, route: string): boolean {
  return currentPath === route || currentPath.startsWith(`${route}/`);
}
```

**Usage**:
```typescript
import { ROUTES, isActiveRoute } from '@/lib/routes';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav>
      <Link
        href={ROUTES.admin.analytics}
        className={isActiveRoute(pathname, ROUTES.admin.analytics) ? 'active' : ''}
      >
        Analytics
      </Link>
    </nav>
  );
}
```

## Migration Strategy

### Phase 1: Establish Foundation (Story 0.4)

**Status**: ✅ Complete

1. ✅ Create `apps/web/lib/routes.ts`
2. ✅ Catalog all existing routes (40+ routes documented)
3. ✅ Add helper functions for dynamic routes
4. ✅ Document usage patterns

**Result**: Foundation ready for incremental adoption

### Phase 2: Incremental Migration (Future)

**Approach**: Migrate route references incrementally, not big-bang.

**Priority Order**:
1. **New code** - Always use ROUTES constant (enforce in code review)
2. **Modified files** - Update when touching file anyway
3. **High-traffic routes** - Admin pages, authentication flows
4. **Low-risk areas** - Marketing pages, static content

**Why Incremental**:
- 40+ files with route references
- High risk of breaking changes
- Can validate each migration separately
- Allows rollback if issues found

### Phase 3: Enforce Standard (Future)

**After majority migration complete**:

1. Add ESLint rule to prevent hardcoded routes (if available)
2. Update contribution guidelines
3. Add pre-commit hook to check new route usage
4. Complete remaining migrations

## Common Patterns and Examples

### Pattern: Multiple Related Routes

```typescript
// Group related routes together
export const ROUTES = {
  admin: {
    companies: {
      root: '/admin/companies',
      create: '/admin/companies/create',
      edit: (id: string) => `/admin/companies/${id}/edit`,
      view: (id: string) => `/admin/companies/${id}`,
    },
  },
};

// Usage in component
<Link href={ROUTES.admin.companies.create}>Create</Link>
<Link href={ROUTES.admin.companies.edit(companyId)}>Edit</Link>
```

### Pattern: External URLs

```typescript
// Document external URLs too (for consistency)
export const EXTERNAL_URLS = {
  docs: 'https://docs.supportsignal.com',
  support: 'https://support.supportsignal.com',
  github: 'https://github.com/supportsignal',
} as const;
```

### Pattern: Conditional Routes

```typescript
// Helper for conditional routing
export function getAdminRoute(user: User) {
  if (user.role === 'system_admin') {
    return ROUTES.admin.root;
  }
  if (user.role === 'company_admin') {
    return ROUTES.admin.companySettings;
  }
  return ROUTES.dashboard;
}
```

### Pattern: Route with Query Parameters

```typescript
// For routes with multiple query params
export const ROUTES = {
  search: (query: string, filters?: { category?: string; status?: string }) => {
    const params = new URLSearchParams({ q: query });
    if (filters?.category) params.set('category', filters.category);
    if (filters?.status) params.set('status', filters.status);
    return `/search?${params.toString()}`;
  },
};

// Usage
ROUTES.search('incidents', { category: 'critical', status: 'open' });
// Returns: '/search?q=incidents&category=critical&status=open'
```

## Testing Route Constants

### Pattern: Route Validation Tests

```typescript
// tests/web/src/lib/routes.test.ts
import { ROUTES, isActiveRoute } from '@/lib/routes';

describe('ROUTES', () => {
  it('should have correct admin routes', () => {
    expect(ROUTES.admin.root).toBe('/admin');
    expect(ROUTES.admin.analytics).toBe('/admin/analytics');
  });

  it('should generate dynamic routes correctly', () => {
    const token = 'abc123';
    expect(ROUTES.auth.resetPassword(token)).toBe('/reset-password?token=abc123');
  });
});

describe('isActiveRoute', () => {
  it('should match exact route', () => {
    expect(isActiveRoute('/admin/analytics', '/admin/analytics')).toBe(true);
  });

  it('should match route prefix', () => {
    expect(isActiveRoute('/admin/analytics/details', '/admin/analytics')).toBe(true);
  });

  it('should not match different route', () => {
    expect(isActiveRoute('/admin/users', '/admin/analytics')).toBe(false);
  });
});
```

## Common Pitfalls

### Pitfall 1: Forgetting to Import ROUTES

```typescript
// ❌ BAD - reverts to hardcoded string
<Link href="/admin/analytics">Analytics</Link>

// ✅ GOOD - use centralized constant
import { ROUTES } from '@/lib/routes';
<Link href={ROUTES.admin.analytics}>Analytics</Link>
```

### Pitfall 2: Mixing Patterns

```typescript
// ❌ BAD - inconsistent patterns
<Link href={ROUTES.admin.analytics}>Analytics</Link>
<Link href="/admin/users">Users</Link>  // Hardcoded!

// ✅ GOOD - consistent pattern
<Link href={ROUTES.admin.analytics}>Analytics</Link>
<Link href={ROUTES.admin.users}>Users</Link>
```

### Pitfall 3: Not Using Type-Safe Helpers

```typescript
// ❌ BAD - manually constructing dynamic route
<Link href={`/admin/companies/${companyId}/edit`}>Edit</Link>

// ✅ GOOD - using helper function
<Link href={ROUTES.admin.companies.edit(companyId)}>Edit</Link>
```

## Success Metrics

**Story 0.4 Results**:
- ✅ 40+ routes cataloged in centralized system
- ✅ Type-safe helper functions for dynamic routes
- ✅ Foundation for reducing route analysis false positives from 72% to <20%
- ✅ IDE autocomplete support for all routes
- ⏳ Incremental migration ongoing (use in new code)

## Related Patterns

- [TypeScript Type Safety Patterns](./typescript-type-safety-patterns.md) - Type safety for routes
- [Component Organization Patterns](./component-organization-patterns.md) - Component structure
- [Frontend Patterns](./frontend-patterns.md) - General React/Next.js patterns

## References

- Story 0.4: Route centralization implementation
- Coding Standards: `docs/architecture/coding-standards.md`
- Routes Definition: `apps/web/lib/routes.ts`
- Next.js Routing: https://nextjs.org/docs/app/building-your-application/routing
