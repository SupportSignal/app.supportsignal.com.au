# Coding Inconsistencies Discovered - Story 0.3 Analysis

**Date**: October 6, 2025
**Analysis Scope**: 246 Convex functions, 40 Next.js routes, 116 React components

---

## Executive Summary

**Yes, the analysis revealed SIGNIFICANT coding inconsistencies** across all three layers (backend, routes, frontend).

**Impact**: Inconsistencies made static analysis extremely difficult, requiring 4-8 iterations per phase to get accurate results.

**Recommendation**: Establish and enforce coding standards to improve maintainability and enable better tooling.

---

## 1. Component Export Pattern Inconsistencies

### Problem: Mixed Export Styles
**Discovered**: Two completely different export patterns used inconsistently

**Pattern 1 - Function Exports** (~52% of components):
```typescript
// Auth components use this
export function AuthProvider({ children }: Props) { ... }
export function LoginForm() { ... }
```

**Pattern 2 - Typed Const Exports** (~48% of components):
```typescript
// Shared components use this
export const StatusBadge: React.FC<StatusBadgeProps> = ({ ... }) => { ... }
export const ActionButton: React.FC<ActionButtonProps> = ({ ... }) => { ... }
```

**Why This Matters**:
- Grep patterns must handle BOTH styles
- TypeScript type extraction differs
- Component name parsing requires different regex
- New developers unsure which pattern to use

**Recommendation**:
- ✅ **Choose ONE pattern** - Prefer `export function` (cleaner, better TypeScript inference)
- ✅ **Document in style guide**
- ✅ **ESLint rule** to enforce consistency

---

## 2. Barrel Export Inconsistency

### Problem: Inconsistent Use of index.ts Barrel Exports
**Discovered**: 11 directories use barrel exports, many don't

**Barrel Export Directories**:
- ✅ analysis/
- ✅ company/
- ✅ incident/
- ✅ incidents/
- ✅ narrative/
- ✅ participants/
- ✅ realtime/
- ✅ shared/
- ✅ user/
- ✅ workflow/
- ✅ admin/impersonation/

**No Barrel Exports**:
- ❌ auth/
- ❌ debug-logs/
- ❌ demo/
- ❌ dev/
- ❌ developer/
- ❌ examples/
- ❌ layout/
- ❌ logging/
- ❌ mobile/
- ❌ theme/
- ❌ ui/
- ❌ users/

**Why This Matters**:
- Inconsistent import patterns: `from '@/components/analysis'` vs `from '@/components/auth/auth-provider'`
- Some developers use barrel exports, others don't
- Refactoring is harder (changing file names breaks imports differently)
- Static analysis complexity (must check both patterns)

**Recommendation**:
- ✅ **Standardize**: Either use barrel exports everywhere or nowhere
- ✅ **Preference**: Use barrel exports for public API directories, skip for internal
- ✅ **Document when to create index.ts**

---

## 3. Convex API Access Pattern Inconsistencies

### Problem: Mixed Type Safety Approaches
**Discovered**: Three different ways to call Convex functions

**Pattern 1 - Direct Typed Access** (safest):
```typescript
const user = await api.auth.getCurrentUser();
```

**Pattern 2 - Type Cast** (breaks static analysis):
```typescript
const createCompany = useMutation((api as any).companies.createCompany);
```

**Pattern 3 - Dynamic Property Access**:
```typescript
const result = await api['moduleName']['functionName']();
```

**Why This Matters**:
- **Phase 1 finding**: Type casts hid 35 Convex functions (50% false positive rate)
- TypeScript can't type-check `(api as any)` calls
- Grep can't detect usage when type casts are used
- Runtime errors instead of compile-time errors

**Recommendation**:
- ✅ **ALWAYS use direct typed access**: `api.module.function`
- ✅ **Fix TypeScript types** instead of casting with `any`
- ✅ **ESLint rule**: Ban `(api as any)` pattern
- ✅ **Investigate**: Why are type casts needed? Fix the root cause

---

## 4. Route Definition Inconsistencies

### Problem: Mixed Navigation Data Structures
**Discovered**: Routes defined in multiple places with different patterns

**Pattern 1 - JSX Link Attributes**:
```typescript
<Link href="/admin/analytics">Analytics</Link>
```

**Pattern 2 - Object Properties** (admin dashboard):
```typescript
const ADMIN_SECTIONS = [
  {
    cards: [
      { href: '/admin/analytics', ... }
    ]
  }
]
```

**Pattern 3 - Template Literals** (backend):
```typescript
return `${config.baseUrl}/reset-password?token=${token}`;
```

**Why This Matters**:
- **Phase 2 finding**: Object properties hid 13 routes (72% false positive rate)
- Grep search for `href="/path"` misses `href: '/path'` (colon vs equals)
- Template literals completely invisible to static analysis
- Navigation scattered across multiple files

**Recommendation**:
- ✅ **Centralize route definitions**: Single source of truth (e.g., `routes.ts`)
- ✅ **Type-safe routes**: Use string literal types
- ✅ **Helper functions**: `route('admin.analytics')` instead of string literals
- ✅ **Example**:
```typescript
// routes.ts
export const ROUTES = {
  admin: {
    analytics: '/admin/analytics',
    users: '/admin/users',
  },
  auth: {
    resetPassword: (token: string) => `/reset-password?token=${token}`,
  }
} as const;
```

---

## 5. Component Organization Inconsistencies

### Problem: No Clear Directory Structure Guidelines
**Discovered**: Components organized by feature, type, and page inconsistently

**By Feature**:
- incidents/ (feature-based)
- company/ (feature-based)
- users/ (feature-based)

**By Type**:
- ui/ (type-based: generic UI components)
- shared/ (type-based: shared utilities)
- layout/ (type-based: layout components)

**By Page**:
- debug-logs/ (page-specific components)
- examples/ (page-specific demos)

**Mixed**:
- admin/ (has impersonation subdirectory, but also PromptTemplateList, TemplateSeederInterface)

**Why This Matters**:
- Unclear where to put new components
- Duplication (StatusBadge vs IncidentStatusBadge - should they be together?)
- Refactoring is harder (moving components breaks imports)
- New developers confused about structure

**Recommendation**:
- ✅ **Document structure**: Create component organization guide
- ✅ **Suggested structure**:
```
components/
├── features/        # Feature-specific (incidents, company, users)
├── layout/          # Layout components (header, footer, sidebar)
├── ui/              # Generic reusable UI (buttons, badges, forms)
└── pages/           # Page-specific components (not reusable)
```

---

## 6. Multiple Exports Per File Inconsistencies

### Problem: Some Files Export Multiple Components, Others Don't
**Discovered**: status-badge.tsx exports 4 components, most files export 1

**Single Export Files** (majority):
```typescript
// incident-card.tsx
export const IncidentCard: React.FC<Props> = ...
```

**Multiple Export Files** (minority):
```typescript
// status-badge.tsx (exports 4!)
export const StatusBadge: React.FC<Props> = ...
export const IncidentStatusBadge: React.FC<Props> = ...
export const CaptureStatusBadge: React.FC<Props> = ...
export const AnalysisStatusBadge: React.FC<Props> = ...
```

**Why This Matters**:
- **Phase 3 finding**: File-level analysis missed 90 components (only found 26)
- Must analyze at component-level, not file-level
- Unclear when to co-locate related components
- Refactoring is harder (splitting files changes imports)

**Recommendation**:
- ✅ **Document policy**: When to co-locate vs separate
- ✅ **Suggested rule**: Co-locate only tightly coupled variants (StatusBadge variants OK)
- ✅ **Default**: One primary component per file

---

## 7. Test Organization Inconsistencies

### Problem: Tests in Multiple Locations
**Discovered**: Some components have __tests__, some don't

**Test Locations Found**:
- `components/auth/__tests__/` (component-adjacent)
- `components/company/__tests__/` (component-adjacent)
- `components/dev/__tests__/` (component-adjacent)
- `tests/web/` (centralized - from previous story work)

**Why This Matters**:
- Unclear where to put tests
- Inconsistent with testing strategy documentation (says centralized)
- Hard to find tests (two locations to check)
- CI configuration complexity

**Recommendation**:
- ✅ **Follow established pattern**: ALL tests in `tests/` directory (centralized)
- ✅ **Remove component-adjacent __tests__ directories**
- ✅ **Document in testing guide**

---

## 8. POC/Experimental Code Identification

### Problem: No Standard Way to Mark POC Code
**Discovered**: POC code mixed with production code, no clear markers

**Examples Found**:
- knowledge.ts (POC marked with comments)
- debug-logs components (POC never wired up, no markers)
- analysis components (POC, no markers)

**Current Markers Used**:
- ✅ knowledge.ts: Has `⚠️ PROOF OF CONCEPT` header
- ❌ debug-logs POC: No markers, looked like production code
- ❌ analysis components: No markers

**Why This Matters**:
- **Phase 3 finding**: 6 debug-logs components created but never used (no POC marker)
- Unclear if zero-usage components are POC or bugs
- Dead code analysis can't distinguish POC from production
- Wastes time investigating obviously experimental code

**Recommendation**:
- ✅ **Standard POC marker**: Use consistent header format
```typescript
/**
 * ⚠️ PROOF OF CONCEPT - [Feature Name]
 *
 * STATUS: Experimental - Not production ready
 * CREATED: [Date]
 * PURPOSE: [Brief description]
 *
 * DO NOT USE IN PRODUCTION
 * DO NOT DELETE WITHOUT TEAM APPROVAL
 */
```
- ✅ **POC directory**: Consider `components/poc/` for experimental components
- ✅ **Cleanup policy**: Document POC lifecycle (when to promote or delete)

---

## 9. Naming Convention Inconsistencies

### Problem: Mixed File Naming Conventions
**Discovered**: kebab-case, PascalCase, camelCase used inconsistently

**Patterns Found**:

**kebab-case** (preferred for components):
- `auth-provider.tsx`
- `status-badge.tsx`
- `incident-card.tsx`

**PascalCase** (used occasionally):
- `ActiveSessionsManager.tsx`
- `ImpersonationBanner.tsx`
- `CompanyDetailsView.tsx`
- `OwnerBadge.tsx`
- `RoleSelector.tsx`
- `UserForm.tsx`

**Why This Matters**:
- Unclear which to use for new files
- Import paths inconsistent look
- Some OS filesystems are case-insensitive (Windows/Mac)
- Refactoring is harder (case changes can break imports)

**Distribution**:
- ~70% kebab-case
- ~30% PascalCase

**Recommendation**:
- ✅ **Standardize on kebab-case** for all component files
- ✅ **Rename PascalCase files** to kebab-case (breaking change, plan migration)
- ✅ **ESLint plugin**: Enforce file naming convention
- ✅ **Example**: `UserForm.tsx` → `user-form.tsx`

---

## 10. Import Path Inconsistencies

### Problem: Mixed Use of Aliases and Relative Paths
**Discovered**: Some files use @/ alias, others use ../../../

**Alias Pattern** (preferred):
```typescript
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
```

**Relative Pattern** (still used):
```typescript
import { useAuth } from '../../../../components/auth/auth-provider';
```

**Why This Matters**:
- Relative paths are fragile (moving files breaks imports)
- Harder to read and maintain
- Inconsistent codebase feel
- TypeScript path mapping benefits lost

**Recommendation**:
- ✅ **ALWAYS use @/ alias** for project imports
- ✅ **ESLint rule**: Enforce no relative imports beyond parent directory
- ✅ **Codemod**: Automated migration from relative to alias imports

---

## Summary of Inconsistencies by Impact

| Inconsistency | Impact on Analysis | Impact on Developers | Fix Priority |
|---------------|-------------------|---------------------|--------------|
| **Type casts `(api as any)`** | 🔴 HIGH (50% false positives) | 🔴 HIGH (TypeScript safety lost) | 🔴 **CRITICAL** |
| **Object vs JSX route definitions** | 🔴 HIGH (72% false positives) | 🟡 MEDIUM (confusing) | 🔴 **HIGH** |
| **Mixed export patterns** | 🟡 MEDIUM (2x grep patterns) | 🟡 MEDIUM (style confusion) | 🟡 **MEDIUM** |
| **Barrel export inconsistency** | 🟡 MEDIUM (2x import patterns) | 🟡 MEDIUM (import confusion) | 🟡 **MEDIUM** |
| **Multiple exports per file** | 🟡 MEDIUM (file vs component level) | 🟢 LOW (works fine) | 🟢 **LOW** |
| **Component organization** | 🟢 LOW (no analysis impact) | 🟡 MEDIUM (unclear structure) | 🟡 **MEDIUM** |
| **File naming (kebab vs Pascal)** | 🟢 LOW (no analysis impact) | 🟢 LOW (minor annoyance) | 🟢 **LOW** |
| **POC code markers** | 🟡 MEDIUM (wasted investigation) | 🟡 MEDIUM (unclear status) | 🟡 **MEDIUM** |
| **Import path (alias vs relative)** | 🟢 LOW (no analysis impact) | 🟡 MEDIUM (refactoring harder) | 🟡 **MEDIUM** |
| **Test organization** | 🟢 LOW (no analysis impact) | 🟢 LOW (minor confusion) | 🟢 **LOW** |

---

## Recommended Actions

### Immediate (Critical)
1. **Ban `(api as any)` type casts** - ESLint rule + fix TypeScript types
2. **Centralize route definitions** - Create `routes.ts` with type-safe helpers
3. **Document POC markers** - Standard header format for experimental code

### Short-Term (High Priority)
1. **Standardize component exports** - Choose function OR const pattern
2. **Barrel export policy** - Document when to create index.ts
3. **Component organization guide** - features/ vs ui/ vs pages/

### Medium-Term (Medium Priority)
1. **File naming migration** - PascalCase → kebab-case (automated codemod)
2. **Import path cleanup** - Relative → @/ alias (automated codemod)
3. **Test migration** - Move __tests__ to centralized tests/

### Long-Term (Low Priority)
1. **Multiple exports policy** - Document when co-location is appropriate
2. **ESLint plugin suite** - Automated enforcement of all standards
3. **Developer onboarding docs** - Coding standards and patterns guide

---

## Impact on Story 0.3 Analysis

**Without these inconsistencies**, dead code analysis would have been:
- ✅ **Faster**: 1-2 iterations instead of 4-8
- ✅ **More accurate**: Fewer false positives (50-78% → ~10-20%)
- ✅ **Easier to automate**: Single grep pattern instead of multiple

**Current state**: Manual investigation required for every "orphaned" item due to low confidence in static analysis.

**Future state with standards**: Automated dead code detection with high confidence (can safely delete without manual review).

---

## Files Generated

- `/tmp/coding-inconsistencies-discovered.md` - This document
- Recommendation: Share with team for coding standards discussion
