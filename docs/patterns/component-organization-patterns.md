# Component Organization Patterns

*Source: Story 0.4 Phase 2 - Component Standards Implementation*
*Last Updated: October 7, 2025*

## Overview

This document captures the component organization patterns established in Story 0.4, including export styles, barrel exports, and directory structure conventions.

## Component Export Pattern

### Standard: Function Declaration Exports

**Pattern**: Use `export function ComponentName()` for all React components.

**Rationale**:
- **Data-driven decision**: 93% of existing codebase (86 of 92 files) already used this pattern
- **Better debugging**: Named functions appear clearly in stack traces
- **Hoisting support**: Can reference before definition if needed
- **Industry standard**: Aligns with React documentation recommendations
- **TypeScript inference**: Better type inference than arrow functions

**ESLint Enforcement**:
```json
{
  "rules": {
    "react/function-component-definition": ["warn", {
      "namedComponents": "function-declaration",
      "unnamedComponents": "arrow-function"
    }]
  }
}
```

### Code Examples

**❌ Incorrect - Arrow Function Export**:
```typescript
// File: apps/web/components/features/user-profile.tsx
export const UserProfile = () => {
  return <div>Profile</div>;
};

// Also incorrect - React.FC with arrow function
export const UserProfile: React.FC<Props> = ({ user }) => {
  return <div>{user.name}</div>;
};
```

**✅ Correct - Function Declaration**:
```typescript
// File: apps/web/components/features/user-profile.tsx
export function UserProfile() {
  return <div>Profile</div>;
}

// With props
interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  return <div>{user.name}</div>;
}
```

**Exception - Higher-Order Components**:
```typescript
// HOCs and wrapped components can use arrow functions
export const withAuth = (Component: React.ComponentType) => {
  return (props: any) => {
    const { user } = useAuth();
    if (!user) return <LoginPage />;
    return <Component {...props} />;
  };
};
```

## Barrel Export Policy

### When to Use Barrel Exports

**Pattern**: Use `index.ts` files strategically for public API aggregation.

**Use Cases**:
1. **Feature directories** with multiple related components
2. **UI libraries** with many reusable primitives
3. **Public APIs** where you want to control what's exposed

**Benefits**:
- Cleaner import statements: `import { UserProfile, UserSettings } from '@/components/features/user'`
- Clear public API surface: Only exported components are "public"
- Easy to refactor internal structure without breaking imports

### When to Avoid Barrel Exports

**Avoid For**:
1. **Simple directories** with only 1-2 components
2. **Performance-critical code** (barrel exports can impact tree-shaking)
3. **Circular dependency risk** (imports between barrel files)

**Anti-Pattern**:
```typescript
// apps/web/components/ui/button/index.ts
// Don't create barrel export for single component
export { Button } from './button';

// Instead, just import directly:
import { Button } from '@/components/ui/button';
```

### Barrel Export Implementation

**Example - Feature Directory**:
```typescript
// apps/web/components/features/user/index.ts
// Public API - exported for external use
export { UserProfile } from './user-profile';
export { UserSettings } from './user-settings';
export { UserAvatar } from './user-avatar';

// Internal components NOT exported (implementation details):
// - user-badge.tsx
// - user-status-indicator.tsx
```

**Usage**:
```typescript
// Clean imports from barrel
import { UserProfile, UserSettings, UserAvatar } from '@/components/features/user';

// Internal components can still import each other directly
// Inside user-profile.tsx:
import { UserBadge } from './user-badge';
```

## Component Directory Structure

### Three-Tier Organization

**Pattern**: Organize components by purpose into three tiers.

```
apps/web/components/
├── ui/                      # Tier 1: Reusable UI primitives
│   ├── button/
│   ├── card/
│   ├── input/
│   └── dropdown/
├── features/                # Tier 2: Feature-specific components
│   ├── user/
│   │   ├── user-profile.tsx
│   │   ├── user-settings.tsx
│   │   ├── user-avatar.tsx
│   │   └── index.ts         # Barrel export
│   ├── incident/
│   └── company/
└── app/*/components/        # Tier 3: Page-specific components
    └── admin/
        └── companies/
            └── components/
                └── company-status-badge.tsx
```

### Tier 1: UI Primitives (`components/ui/`)

**Purpose**: Reusable, generic UI components with no business logic.

**Characteristics**:
- Generic and configurable
- No direct API calls or business logic
- Can be used across multiple features
- Often wrap ShadCN/Radix UI primitives

**Examples**:
```typescript
// components/ui/button.tsx
export function Button({ variant, size, children, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }))} {...props}>{children}</button>;
}

// components/ui/card.tsx
export function Card({ children, className }: CardProps) {
  return <div className={cn("rounded-lg border bg-card", className)}>{children}</div>;
}
```

**When to Use**:
- Creating reusable UI elements
- Wrapping third-party UI libraries
- Implementing design system components

### Tier 2: Feature Components (`components/features/`)

**Purpose**: Feature-specific components with business logic.

**Characteristics**:
- Contains business logic and API calls
- Feature-specific, not generic
- May use UI primitives from Tier 1
- Can be reused across multiple pages within the feature

**Examples**:
```typescript
// components/features/user/user-profile.tsx
export function UserProfile({ userId }: UserProfileProps) {
  const user = useQuery(api.users.getUser, { userId });

  return (
    <Card>
      <UserAvatar user={user} />
      <div>{user.name}</div>
      <Button onClick={editProfile}>Edit</Button>
    </Card>
  );
}

// components/features/incident/incident-form.tsx
export function IncidentForm() {
  const createIncident = useMutation(api.incidents.create);
  // Feature-specific form logic
}
```

**When to Use**:
- Components specific to a feature domain (users, incidents, companies)
- Business logic that's reused across multiple pages
- Components that make API calls

### Tier 3: Page-Specific (`app/*/components/`)

**Purpose**: Components used only on a single page or route.

**Characteristics**:
- Lives alongside the page that uses it
- Not reused elsewhere in the application
- Often very specific to page layout or flow
- No barrel exports needed

**Examples**:
```typescript
// app/admin/companies/components/company-status-badge.tsx
// Only used on admin companies page
export function CompanyStatusBadge({ status }: Props) {
  // Very specific styling/logic for this admin page
}

// app/dashboard/components/dashboard-stats.tsx
// Only used on dashboard page
export function DashboardStats() {
  // Dashboard-specific stats display
}
```

**When to Use**:
- Component is only used on one page
- Very specific to page layout or flow
- Not worth extracting to features directory

## Migration Guidelines

### Adding a New Component - Decision Tree

```
Is this component used on multiple pages?
  ├─ NO → Place in app/*/components/ (Tier 3)
  └─ YES → Does it have business logic or API calls?
      ├─ YES → Place in components/features/ (Tier 2)
      └─ NO → Is it generic and reusable?
          ├─ YES → Place in components/ui/ (Tier 1)
          └─ NO → Place in components/features/ (Tier 2)
```

### Existing Component Migration

**When to Refactor**:
1. Component is in wrong tier (e.g., page-specific in features/)
2. Component is being reused but lives in app directory
3. Generic component has business logic mixed in

**How to Refactor**:
1. Identify current tier and target tier
2. Move component to new location
3. Update all imports (use search/replace or codemod)
4. Consider adding barrel export if in features/
5. Run full test suite to verify

### Common Pitfalls

**❌ Don't Mix Tiers**:
```typescript
// BAD - UI component with business logic
export function Button() {
  const user = useQuery(api.users.current); // Business logic in UI component
  return <button>{user.name}</button>;
}
```

**❌ Don't Over-Extract**:
```typescript
// BAD - Extracting page-specific component to features
// app/admin/companies/page.tsx uses this ONLY on this page
// components/features/company/admin-page-header.tsx ← Too specific!
```

**✅ Do Compose Properly**:
```typescript
// GOOD - UI component stays generic
export function Button({ children }: ButtonProps) {
  return <button>{children}</button>;
}

// GOOD - Feature component uses UI components
export function UserProfileButton() {
  const user = useQuery(api.users.current);
  return <Button>{user.name}</Button>; // Composes UI component
}
```

## Related Patterns

- [TypeScript Type Safety Patterns](./typescript-type-safety-patterns.md) - Type safety for components
- [Centralized Routing Patterns](./centralized-routing-patterns.md) - Route management for navigation
- [Frontend Patterns](./frontend-patterns.md) - General React/Next.js patterns

## References

- Story 0.4: Component organization standards implementation
- Coding Standards: `docs/architecture/coding-standards.md`
- ESLint Configuration: `apps/web/.eslintrc.json`
