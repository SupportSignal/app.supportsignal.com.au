# UAT Checklist: Story 0.5 - File Naming Migration to Kebab-Case

## Status
**Story Status**: Phases 1-4 Complete (✅) | Phase 5 Deferred to KDD

## Pre-UAT Verification

### ✅ Automated Tests Status (Completed by Dev Agent)
- [x] `bun run typecheck` - ✅ **PASSES** (confirmed in Phase 2, 3, 4)
- [x] `bun run lint` - ✅ **Pre-existing warnings only** (no new errors)
- [x] `bun test` - ✅ **Pre-existing failures only** (no new test failures)
- [x] `bun run build` - ❓ **Needs verification**

### Test Coverage Analysis
**From Story Tasks**:
- ✅ Components migration validated (Phase 2)
- ✅ App directory migration validated (Phase 3)
- ✅ Import path cleanup validated (Phase 4)
- ✅ Git rename preservation verified (R flags)
- ✅ TypeScript compilation verified
- ⚠️ **E2E tests NOT run** - Story AC #12 requires `bun test:e2e`
- ⚠️ **Build verification needed** - Story AC #14 requires successful build

---

## UAT Test Plan

### Test Group 1: File Naming Verification (AC: 3, 8, 9)

**UAT-1.1: Verify Components Directory Migration**
- [ ] Navigate to `apps/web/components/` directory
- [ ] Verify ALL component files use kebab-case naming (e.g., `user-profile.tsx`)
- [ ] Confirm NO PascalCase component files remain (except valid exceptions)
- [ ] **Expected**: All component files in kebab-case format

**UAT-1.2: Verify App Directory Migration**
- [ ] Navigate to `apps/web/app/` directory
- [ ] Verify debug components use kebab-case (e.g., `debug-panel.tsx`)
- [ ] Confirm Next.js special files remain unchanged: `page.tsx`, `layout.tsx`, `error.tsx`
- [ ] **Expected**: Debug components kebab-case, special files unchanged

**UAT-1.3: Check for Missed Files**
- [ ] Run: `find apps/web -name "*[A-Z]*.tsx" -type f | grep -v node_modules`
- [ ] Review results for any PascalCase files that shouldn't exist
- [ ] **Expected**: Only Next.js conventions (`page.tsx`, `layout.tsx`, etc.)

---

### Test Group 2: Import Resolution Verification (AC: 4, 5, 10)

**UAT-2.1: Verify Component Imports**
- [ ] Open a component that imports other components (e.g., `apps/web/app/page.tsx`)
- [ ] Verify all imports use `@/` path aliases (not `../../`)
- [ ] Verify imports reference kebab-case filenames
- [ ] **Expected**: `import { Component } from '@/components/kebab-case'`

**UAT-2.2: Verify Barrel Export Imports**
- [ ] Check barrel export files (e.g., `apps/web/components/ui/index.ts`)
- [ ] Verify `export * from './kebab-case'` statements
- [ ] **Expected**: All barrel exports use kebab-case paths

**UAT-2.3: Check for Relative Import Regressions**
- [ ] Run: `bun run lint` and check for relative import warnings
- [ ] **Expected**: ESLint warns on any `../../` import patterns (AC: 11)

---

### Test Group 3: Git History Preservation (AC: 6)

**UAT-3.1: Verify Git Rename Detection**
- [ ] Run: `git log --follow -- apps/web/components/ui/button.tsx`
- [ ] Verify history shows both old (PascalCase) and new (kebab-case) names
- [ ] **Expected**: Full commit history preserved through rename

**UAT-3.2: Check Git Status**
- [ ] Run: `git status`
- [ ] Verify files show as renamed (R flag), not deleted/added (D/A flags)
- [ ] **Expected**: All migrations show as renames (R flag) in git

---

### Test Group 4: Build & Test Suite Validation (AC: 12, 13, 14)

**UAT-4.1: TypeScript Compilation** ✅ **VERIFIED**
- [x] Run: `bun run typecheck`
- [x] **Result**: ✅ **PASSES** (confirmed in story tasks)

**UAT-4.2: Unit Test Suite** ✅ **PARTIALLY VERIFIED**
- [x] Run: `bun test`
- [x] **Result**: ✅ **Pre-existing failures only** (no NEW failures from migration)
- [ ] **Action Required**: Review pre-existing test failures (separate from migration)

**UAT-4.3: E2E Test Suite** ⚠️ **NOT VERIFIED**
- [ ] Run: `bun test:e2e`
- [ ] Verify all E2E tests pass
- [ ] **Expected**: No failures related to file naming changes
- [ ] **Status**: ⚠️ **REQUIRED by AC #12 but not yet executed**

**UAT-4.4: Production Build** ⚠️ **NOT VERIFIED**
- [ ] Run: `bun run build`
- [ ] Verify build completes without errors
- [ ] Check build output for warnings
- [ ] **Expected**: Successful production build
- [ ] **Status**: ⚠️ **REQUIRED by AC #14 but not yet verified**

---

### Test Group 5: Application Functionality (Manual Smoke Test)

**UAT-5.1: Start Development Server**
- [ ] Run: `bun dev`
- [ ] Verify server starts without errors
- [ ] Check console for import resolution errors
- [ ] **Expected**: Clean startup with no errors

**UAT-5.2: Navigate Key Routes**
- [ ] Visit `/` (home page)
- [ ] Visit `/admin` (admin routes)
- [ ] Visit `/incidents` (incident management)
- [ ] **Expected**: All pages load without console errors

**UAT-5.3: Verify Component Rendering**
- [ ] Check that UI components render correctly (buttons, forms, modals)
- [ ] Verify no "Component not found" errors in console
- [ ] Test interactive components (click buttons, submit forms)
- [ ] **Expected**: All components work as before migration

**UAT-5.4: Check Browser Console**
- [ ] Open browser dev tools console
- [ ] Refresh pages and navigate application
- [ ] **Expected**: No import errors, no module not found errors

---

## Critical Issues to Check

### High Priority Verification

1. **Dynamic Imports** (Story Risk #2)
   - [ ] Search codebase for `import()` or `require()` statements
   - [ ] Verify these use correct kebab-case paths
   - [ ] **Command**: `grep -r "import(" apps/web/`

2. **Case-Sensitive Git** (Story Risk #4)
   - [ ] Run: `git config core.ignorecase`
   - [ ] If `true`, verify renames detected correctly
   - [ ] **Expected**: Renames properly tracked regardless of case sensitivity

3. **ESLint Rule Enforcement** (AC: 11)
   - [ ] Check `.eslintrc` for `no-restricted-imports` rule
   - [ ] Test by adding a relative import: `import { X } from '../../X'`
   - [ ] **Expected**: ESLint warning appears

---

## UAT Sign-Off Criteria

### ✅ Must Pass Before Story Complete

- [ ] **All UAT tests in Groups 1-3 pass**
- [ ] **E2E test suite passes** (UAT-4.3) - ⚠️ **BLOCKING**
- [ ] **Production build succeeds** (UAT-4.4) - ⚠️ **BLOCKING**
- [ ] **Manual smoke test passes** (Group 5)
- [ ] **No regressions found** in application functionality
- [ ] **Git history preserved** for all renamed files

### 📋 Additional Requirements

- [ ] **Phase 5 Documentation** (Deferred to KDD process)
  - Migration script usage guide
  - Kebab-case standard documentation
  - Rollback procedure documentation

---

## UAT Execution Log

### Test Session 1: ___________________
**Tester**: _____________
**Date**: _____________
**Environment**: Development

**Results**:
- Group 1: ☐ Pass ☐ Fail - Notes: _______________
- Group 2: ☐ Pass ☐ Fail - Notes: _______________
- Group 3: ☐ Pass ☐ Fail - Notes: _______________
- Group 4: ☐ Pass ☐ Fail - Notes: _______________
- Group 5: ☐ Pass ☐ Fail - Notes: _______________

**Issues Found**:
1. _______________
2. _______________

**Sign-Off**: ☐ Approved ☐ Needs Fixes

---

## Next Steps After UAT

### If UAT Passes ✅
1. Execute Phase 5 KDD knowledge capture
2. Mark story as **Done**
3. Update story change log
4. Commit final changes

### If UAT Fails ❌
1. Document all failures in story
2. Create fix tasks
3. Re-run UAT after fixes
4. Do NOT mark story complete until UAT passes
