# KDD Lessons Learned

This document captures critical lessons learned during development to prevent repeated pattern violations and improve velocity.

## Pattern Compliance Violations

### TypeScript "No Any Policy" (Story 3.3)

**❌ What Happened:**

- Used `any` types in Convex functions despite explicit "No Any Policy" in CLAUDE.md
- Generated 118+ ESLint errors across multiple files
- Violated established code quality standards

**✅ Prevention:**

- Always import proper types: `QueryCtx`, `MutationCtx`, `ActionCtx` from Convex
- Check existing function signatures before implementing new ones
- Validate against CLAUDE.md standards before coding

**Impact:** -33% velocity due to rework time

### Production/Test Separation (Story 3.3)

**❌ What Happened:**

- Created Jest mock files that loaded in production browser runtime
- Caused 500 Internal Server Error: "jest is not defined" in production
- Test infrastructure contaminated production code

**✅ Prevention:**

- Keep test files in `__tests__/` directories or `.test.ts` extensions only
- Never create `.js` mock files that can be imported by production code
- Use proper Jest configuration for mocking libraries

**Impact:** Critical production error, immediate hotfix required

### User Request Overengineering (Story 3.3)

**❌ What Happened:**

- User asked for "menu back to home page"
- Implemented complex navigation system instead of simple link
- Required 4 iterations: complex nav → broken syntax → restore → simple link

**✅ Prevention:**

- Check existing patterns first (`git grep` for similar features)
- Ask "what's the simplest solution?" before implementing
- Reference established patterns (auth pages had simple "← Back to Home" links)

**Impact:** 30 minutes wasted, user frustration, broken code

## Process Improvements

### Pre-Implementation Checklist

Before writing any code:

1. **Pattern Check**: `git grep` for existing similar implementations
2. **Standards Review**: Validate against CLAUDE.md requirements
3. **Scope Clarity**: Ensure understanding matches user intent
4. **Type Safety**: Plan TypeScript approach with proper imports

### Context Understanding

**Terminology Mapping in This Codebase:**

- "menu" often means "simple link" (see auth pages pattern)
- "navigation" can mean complex nav bar OR simple breadcrumb
- "admin dashboard" means tabbed real-time monitoring interface

**Always check existing usage before assuming scope.**

### Test/Production Separation Rules

**✅ Safe Test Patterns:**

- Files in `__tests__/` directories
- Files with `.test.ts` or `.test.tsx` extensions
- Jest configuration mocks in `jest.setup.js`

**❌ Dangerous Patterns:**

- `.js` files in production TypeScript codebase
- Mock files outside test directories
- Test utilities accessible to production imports

## Architecture Patterns

### Convex Function Context Rules

**Query Functions (`QueryCtx`):**

- Read-only database operations
- Cannot use `ctx.db.insert()`, `ctx.db.patch()`, `ctx.db.delete()`
- For data fetching and computed values

**Mutation Functions (`MutationCtx`):**

- Database write operations
- Can read and write to database
- For state changes and data modifications

**Action Functions (`ActionCtx`):**

- External API calls and side effects
- Can call mutations via `ctx.runMutation()`
- For OAuth, webhooks, and external integrations

**❌ Never mix contexts or use wrong context type for operation.**

### ShadCN UI Component Patterns

**Type-Safe Component Usage:**

```typescript
// ❌ Wrong - allows any string
<Badge variant="unknown">

// ✅ Correct - explicit typing
<Badge variant="destructive" | "default" | "outline" | "secondary">
```

**Return Type Patterns:**

```typescript
// ❌ Wrong - inferred any
const getStatus = (usage: number) => {
  if (usage >= 90) return { status: 'critical', color: 'destructive' };
};

// ✅ Correct - explicit return type
const getStatus = (
  usage: number
): {
  status: string;
  color: 'default' | 'destructive' | 'outline' | 'secondary';
} => {
  if (usage >= 90) return { status: 'critical', color: 'destructive' as const };
};
```

## Velocity Impact Data

### Story 3.3 Analysis

**Expected Time:** 2 hours
**Actual Time:** 3 hours  
**Velocity Loss:** 33%

**Root Causes:**

- 50% - Not checking existing patterns first
- 30% - Violating established coding standards
- 20% - Overengineering simple requests

**Time Breakdown:**

- TypeScript violation recovery: 45 minutes
- Jest mock production error: 30 minutes
- Navigation overengineering: 30 minutes
- Syntax fixing: 15 minutes

**Total Rework Time:** 2 hours (100% of expected story time)

## Future Recommendations

1. **Mandatory Pattern Check**: Before any implementation, grep for existing patterns
2. **Standards Validation**: Cross-reference CLAUDE.md for all coding decisions
3. **Scope Verification**: When user request seems complex, check if simple solution exists
4. **Test Isolation**: Never allow test infrastructure to contaminate production
5. **TypeScript Strictness**: Maintain zero `any` types policy

## Success Patterns

**✅ What Worked Well in Story 3.3:**

- ShadCN UI component integration
- Convex real-time query patterns (when implemented correctly)
- Admin dashboard modular architecture
- Comprehensive test coverage

**Continue these patterns in future stories.**

---

_Last Updated: Story 3.3 completion_
_Next Review: After Story 3.4 completion_
