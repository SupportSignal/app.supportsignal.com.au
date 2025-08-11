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

## Sample Data Architecture Patterns (Epic 3 Development)

### Architectural Coupling Violation

**❌ What Happened:**

- Mixed sample data business logic with UI component code
- Created tightly-coupled `SampleDataButton` with embedded scenario data
- Duplicated sample data definitions across frontend and backend systems
- User feedback: "You put a whole lot of sample data logic into the sample data button... we should separate the data creation from the actual control."

**✅ Prevention:**

- **Separate UI from Data**: UI components should be generic and consume data via props/APIs
- **Centralize Data Logic**: All sample data definitions should exist in backend with single source of truth
- **Use Generic Components**: Create reusable UI components that work with any data structure
- **Follow Cross-Cutting Pattern**: Backend services should support multiple use cases via configuration

**Impact:** User identified architectural flaw requiring immediate refactor to prevent technical debt

### Generic vs Specific Component Design

**❌ Wrong Approach:**
```typescript
// Tightly-coupled component with embedded data
export function SampleDataButton() {
  const scenarios = [ /* hardcoded scenarios */ ];
  return <DropdownMenu>{scenarios.map(...)}</DropdownMenu>;
}
```

**✅ Correct Approach:**
```typescript
// Generic component consuming external data
export function SampleDataButton({ 
  options, 
  onOptionSelect, 
  variant = "simple" | "dropdown" 
}) {
  return <DropdownMenu>{options.map(...)}</DropdownMenu>;
}

// Centralized data provider
const scenarios = getIncidentScenarios(participantFirstName);
<SampleDataButton options={scenarios} onOptionSelect={handleSelect} />
```

### Sample Data UI Styling Standards

**✅ Preferred Button Style (Established Pattern):**

```css
/* Consistent styling across all sample data buttons */
text-xs text-gray-500 hover:text-white hover:bg-ss-teal 
border-b border-dashed border-gray-300 rounded-none 
hover:border-ss-teal transition-all duration-200
```

**Rationale:** 
- Subtle gray text indicates administrative/testing function
- Teal hover provides clear interactive feedback
- Dashed underline suggests "development/sample" nature
- Consistent across all administrative functions

### Cross-Cutting Backend Service Pattern

**✅ Successful Implementation:**

```typescript
// Single backend service supports multiple forms
export const generateRandomIncidentMetadata = mutation({
  args: {
    sessionToken: v.string(),
    excludeFields: v.optional(v.array(v.string())), // 🔑 Configurable
  },
  handler: async (ctx, args) => {
    // Permission checking, database access, centralized logic
    return { success: true, data: result, metadata: {...} };
  }
});

// Any component can use this pattern
const result = await generateRandomData({
  sessionToken,
  excludeFields: ['reporter_name'] // Customize per use case
});
```

**Benefits:**
- **No Code Duplication**: One service, multiple consumers
- **Database-Driven**: Uses real company participants, not hardcoded data
- **Permission-Secured**: Consistent `SAMPLE_DATA` permission model
- **Configurable**: `excludeFields` allows per-component customization

### Data Architecture Lessons

**Single Source of Truth Principle:**

- ❌ **Wrong**: Frontend components maintain local sample data
- ❌ **Wrong**: Duplicate scenario definitions in multiple locations
- ✅ **Correct**: Backend defines all sample data, frontend consumes via API
- ✅ **Correct**: Centralized data with dynamic participant interpolation

**Separation of Concerns:**

- **Data Layer**: Backend services handle generation, validation, permissions
- **Business Logic**: Centralized scenario definitions with interpolation utilities  
- **UI Layer**: Generic components focused only on presentation and interaction
- **Integration Layer**: Clean interfaces between layers via well-defined APIs

### Implementation Quality Metrics

**Epic 3 Sample Data Work:**
- **Architectural Refactor**: Required due to coupling violation
- **User Satisfaction**: High after addressing separation of concerns
- **Code Reusability**: Generic components + centralized data = high reuse potential
- **Maintainability**: Single source of truth eliminates drift risk

**Success Patterns:**
- User-driven architectural feedback prevented technical debt
- Playground approach allowed UI pattern evaluation before production
- Centralized backend service with configuration flexibility
- Generic UI components with consistent styling standards

**Time Investment:**
- Initial tightly-coupled approach: ~2 hours
- Architectural refactor: ~1 hour  
- **Net Benefit**: Prevented future maintenance issues, improved system design

### Showcase-Application Synchronization Drift

**❌ What Happened:**

- Created components directly in application without updating showcase
- Showcase became outdated and out of sync with production components
- Lost design system consistency and component discoverability
- No systematic process to maintain showcase as single source of UI truth

**✅ Prevention:**

- **Component-First Development**: Create components in showcase first, then import to application
- **Bidirectional Updates**: When creating components in application, backport to showcase
- **Showcase Maintenance**: Regular showcase review and updates as part of epic completion
- **Design System Governance**: Establish showcase as authoritative component library

**Impact:** Design system degradation, component duplication risk, reduced discoverability

**Future Consideration:** 
- Dedicated epic task to sync showcase with current application components
- Process establishment for maintaining showcase-application parity
- Component audit to identify application components missing from showcase

---

_Last Updated: Story 3.3 completion_
_Next Review: After Story 3.4 completion_
