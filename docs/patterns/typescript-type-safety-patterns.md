# TypeScript Type Safety Patterns

*Source: Story 0.4 Phase 1 - Type Safety Implementation*
*Last Updated: October 7, 2025*

## Overview

This document captures TypeScript type safety patterns established in Story 0.4, including the elimination of `any` type casts, proper handling of Convex API types, and ESLint enforcement strategies.

## Core Principle: No `any` Type

### The Problem: Type Cast to `any`

**Anti-Pattern Identified**: `(api as any)` type casting

**Why This is Dangerous**:
- Completely bypasses TypeScript's type safety
- Hides real type errors that could cause runtime failures
- Makes refactoring dangerous (no compile-time checks)
- Prevents IDE autocomplete and IntelliSense
- Masks issues with Convex API type generation

**Real Example from Codebase**:
```typescript
// ❌ BEFORE - Dangerous type cast
// @ts-nocheck at top of file
const companies = useQuery((api as any).companies.listAllCompanies) || [];
const updateCompanyStatus = useMutation((api as any).companies.updateCompanyStatus);
```

**Impact**: Found in 4 instances across 2 files, causing 50% false positive rate in type analysis.

### The Solution: Three-Tier Approach

**Tier 1 - Proper Typing (Preferred)**:
```typescript
// ✅ BEST - Proper typing with imported API
import { api } from '@/convex/_generated/api';

const companies = useQuery(api.companies.listAllCompanies) || [];
const updateCompanyStatus = useMutation(api.companies.updateCompanyStatus);
```

**Tier 2 - Targeted `@ts-expect-error` (When Necessary)**:
```typescript
// ✅ ACCEPTABLE - Documented exception for known limitation
import { api } from '@/convex/_generated/api';

// @ts-expect-error - Convex type inference limitation with complex API types
const companies = useQuery(api.companies.listAllCompanies) || [];
```

**Tier 3 - Never Use `@ts-nocheck` (Banned)**:
```typescript
// ❌ BANNED - Blanket suppression hides real issues
// @ts-nocheck

// This file now has NO type checking at all!
// Real bugs can slip through
```

## Convex API Type Patterns

### Pattern: Convex Type Inference Limitations

**Context**: Convex auto-generates TypeScript types, but sometimes type inference fails for complex API structures.

**When This Happens**:
- Complex query/mutation with many parameters
- Deeply nested return types
- Union types or conditional types
- Type generation runs but misses certain functions

**Correct Handling**:
```typescript
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';

// Use targeted @ts-expect-error with clear explanation
// @ts-expect-error - Convex type inference limitation with complex API types
const data = useQuery(api.complexModule.complexFunction);

// @ts-expect-error - Convex type inference limitation with complex API types
const mutation = useMutation(api.complexModule.updateFunction);
```

**Why This Works**:
- ✅ Type checking still happens elsewhere in the file
- ✅ Documents the specific issue
- ✅ Forces re-evaluation if code changes
- ✅ Easy to search for: `git grep "@ts-expect-error.*Convex"`
- ✅ Shows up in PR reviews for discussion

### Pattern: Regenerating Convex Types

**When Types Are Stale**:
```bash
# Symptoms:
# - TypeScript errors on valid Convex API calls
# - Missing functions in api object
# - Outdated type definitions

# Solution - regenerate types:
bunx convex dev --once --typecheck=disable

# Or during development:
bunx convex dev  # Auto-regenerates on schema changes
```

**Best Practices**:
1. Run `bunx convex dev` during development (auto-regenerates)
2. Commit `_generated` directory to version control
3. If types are stale after pull, run `bunx convex dev --once`
4. Don't work around with `any` - regenerate types instead

## ESLint Enforcement Patterns

### Pattern: Pragmatic Enforcement with `warn`

**Decision**: Use `"warn"` level for existing code, not `"error"`.

**Rationale**:
- Allows existing codebase to build (doesn't block development)
- Prevents new violations (developers see warnings)
- Can be upgraded to "error" after cleanup
- Follows incremental improvement philosophy

**ESLint Configuration**:
```json
{
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",

    // Prevent type casts to any - specifically targeting (api as any) pattern
    // Use @ts-expect-error with explanation for unavoidable Convex type inference issues
    // Note: Set to "warn" to allow existing code to build while preventing new violations
    "@typescript-eslint/no-explicit-any": ["warn", {
      "ignoreRestArgs": false
    }],

    // Prevent unsafe type assertions
    "@typescript-eslint/consistent-type-assertions": ["error", {
      "assertionStyle": "as",
      "objectLiteralTypeAssertions": "allow-as-parameter"
    }]
  }
}
```

**When to Use `"warn"` vs `"error"`**:

| Use `"warn"` | Use `"error"` |
|-------------|--------------|
| Pre-existing violations in codebase | New rules for greenfield code |
| Migration period for large refactors | Critical type safety issues |
| Gradual improvement strategy | Can't risk runtime errors |
| Team learning new pattern | Well-established pattern |

### Pattern: Test File Overrides

**Pattern**: Relax rules for test files where `any` is sometimes pragmatic.

```json
{
  "overrides": [
    {
      "files": ["**/__tests__/**/*", "**/*.test.*"],
      "env": {
        "jest": true
      },
      "rules": {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-require-imports": "off",
        "no-console": "off"
      }
    }
  ]
}
```

**Why Tests Are Different**:
- Mocking often requires `any` for complex types
- Test setup code doesn't need production-level safety
- Interfacing with test frameworks that use `any`
- Pragmatic trade-off: test coverage > perfect types

## Type Assertion Patterns

### Pattern: Consistent Assertion Style

**Standard**: Use `as` syntax, not angle brackets.

```typescript
// ✅ CORRECT - 'as' syntax
const user = response as User;
const element = document.getElementById('root') as HTMLDivElement;

// ❌ INCORRECT - Angle bracket syntax
const user = <User>response;  // Conflicts with JSX
const element = <HTMLDivElement>document.getElementById('root');
```

**ESLint Enforcement**:
```json
{
  "rules": {
    "@typescript-eslint/consistent-type-assertions": ["error", {
      "assertionStyle": "as",
      "objectLiteralTypeAssertions": "allow-as-parameter"
    }]
  }
}
```

**Why `as` syntax**:
- Compatible with JSX (angle brackets conflict)
- More readable in React codebases
- Industry standard for TypeScript + React

### Pattern: Safe Type Narrowing

**Prefer Type Guards over Assertions**:

```typescript
// ❌ UNSAFE - Type assertion
function processUser(data: unknown) {
  const user = data as User;  // Runtime error if data isn't User!
  return user.email;
}

// ✅ SAFE - Type guard
function processUser(data: unknown) {
  if (typeof data === 'object' && data !== null && 'email' in data) {
    // TypeScript now knows data has 'email' property
    return (data as User).email;
  }
  throw new Error('Invalid user data');
}

// ✅ BETTER - Zod validation
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

function processUser(data: unknown) {
  const user = UserSchema.parse(data);  // Runtime validation + type inference
  return user.email;  // TypeScript knows this is safe
}
```

## Common Type Safety Pitfalls

### Pitfall 1: Blanket `@ts-nocheck`

**Problem**:
```typescript
// @ts-nocheck at top of file
// Entire file now has NO type checking!

// This function has a bug but TypeScript won't catch it:
export function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
  // What if item.price is undefined? No error!
}
```

**Solution**:
```typescript
// Remove blanket suppression, add targeted suppressions

export function calculateTotal(items: Item[]) {
  // TypeScript catches undefined price issue
  return items.reduce((sum, item) => sum + (item.price ?? 0), 0);
}

// Only suppress where truly necessary:
// @ts-expect-error - Convex type inference limitation
const data = useQuery(api.complex.function);
```

**Lesson**: Blanket suppressions are dangerous - always use targeted suppressions.

### Pitfall 2: Type Cast to `any` in Production Code

**Problem**:
```typescript
// ❌ Casting to any loses all type safety
const result = (response as any).data.user.email;
// What if response.data doesn't exist? Runtime error!
```

**Solution**:
```typescript
// ✅ Proper type definition
interface ApiResponse {
  data: {
    user: {
      email: string;
    }
  }
}

const result = (response as ApiResponse).data.user.email;
// TypeScript validates structure at compile time

// ✅ Or use optional chaining for safety
const result = (response as ApiResponse)?.data?.user?.email;
```

### Pitfall 3: Ignoring Convex Type Generation

**Problem**:
```typescript
// Instead of fixing type generation, work around with any:
const data = useQuery((api as any).users.getUser);
```

**Solution**:
```typescript
// Fix the root cause:
# Terminal
bunx convex dev --once  # Regenerate types

// Then use proper types:
const data = useQuery(api.users.getUser);

// If still broken, document with @ts-expect-error:
// @ts-expect-error - Convex type generation issue, see issue #123
const data = useQuery(api.users.getUser);
```

## Migration Strategy

### Phase 1: Eliminate Type Casts

1. **Find all instances**:
```bash
grep -r "(api as any)" apps/ --include="*.tsx" --include="*.ts"
grep -r "@ts-nocheck" apps/ --include="*.tsx" --include="*.ts"
```

2. **Remove blanket suppressions**:
```typescript
// Remove @ts-nocheck from file header
// Try to compile - see what real errors appear
```

3. **Fix or document each error**:
```typescript
// If fixable: Fix the type properly
const data = useQuery(api.users.getUser);

// If Convex limitation: Add targeted suppression
// @ts-expect-error - Convex type inference limitation
const data = useQuery(api.complex.function);
```

### Phase 2: Add ESLint Rules

1. **Install dependencies**:
```bash
bun add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

2. **Configure ESLint** (see configuration above)

3. **Set to "warn" initially**:
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": ["warn", {
      "ignoreRestArgs": false
    }]
  }
}
```

4. **Run lint to see violations**:
```bash
bun run lint
# Review warnings, plan cleanup
```

5. **Gradually upgrade to "error"**:
```json
// After cleaning up violations:
{
  "rules": {
    "@typescript-eslint/no-explicit-any": ["error", {
      "ignoreRestArgs": false
    }]
  }
}
```

## Success Metrics

**Story 0.4 Results**:
- ✅ Eliminated 4 instances of `(api as any)` (100% of found violations)
- ✅ Removed 2 blanket `@ts-nocheck` headers
- ✅ Added 2 targeted `@ts-expect-error` with explanations
- ✅ ESLint rules active (warn level)
- ✅ Type safety false positives: 50% → ~0%

## Related Patterns

- [Component Organization Patterns](./component-organization-patterns.md) - Component structure and exports
- [Centralized Routing Patterns](./centralized-routing-patterns.md) - Type-safe route definitions
- [Backend Patterns](./backend-patterns.md) - Convex type patterns

## References

- Story 0.4: Type safety implementation
- Coding Standards: `docs/architecture/coding-standards.md`
- ESLint Configuration: `apps/web/.eslintrc.json`
- TypeScript Documentation: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
