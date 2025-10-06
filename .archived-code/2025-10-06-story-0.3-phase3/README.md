# Archived Code - Story 0.3 Phase 3 Dead Code Cleanup

**Date**: October 6, 2025
**Story**: 0.3 - Dead Code Discovery & Cleanup
**Phase**: Phase 3 - React Components & Hooks

## Why This Code Was Archived

During systematic React component dead code analysis (4 iterations), these components were identified as having **ZERO production usage** and classified as "obvious" deletion candidates.

## Archived Components (7 total)

### 1. AutoSaveExample (ENTIRE COMPONENT)
**File**: `apps/web/components/examples/auto-save-example.tsx`
**Reason**: Demo/example component, zero usage, no documentation references
**Created**: August 11, 2025
**Location**: Examples directory (clearly marked as demo code)

**What It Did**:
- Demonstration component for auto-save functionality
- Educational/reference code

**Why Removed**:
- Zero imports detected in codebase
- Zero JSX usage in any pages
- Located in `/examples/` directory (demo code)
- No documentation references found
- Human decision: OBVIOUS deletion candidate

---

### 2-7. Debug-Logs POC Components (6 COMPONENTS - Created Together, Never Used)
**Created**: August 5, 2025 in commit 9c5725b
**Commit**: "fix: resolve log-ingestion worker sync issues and complete system synchronization"
**Reason**: POC/abandoned components - debug-logs page uses completely different implementation

**Files Removed**:
1. **cleanup-controls.tsx** - Log cleanup UI controls
2. **cost-monitoring.tsx** - Cost tracking display component
3. **database-health.tsx** - Database status health indicator
4. **log-search.tsx** - Log search interface component
5. **rate-limit-status.tsx** - Rate limit status display
6. **system-health-overview.tsx** - System health dashboard overview

**What They Did**:
- Early POC components for debug-logs feature
- Comprehensive logging system UI elements
- Cost monitoring and health tracking

**Why Removed**:
- Created together on Aug 5, 2025 (3 months old)
- Debug-logs page uses DIFFERENT components entirely:
  - RedisStatsCard
  - SyncControlsCard
  - DebugLogsTable
  - ExportControlsCard
  - SuppressionRulesPanel
- Zero imports detected in codebase
- Zero JSX usage in any pages
- Replaced by different implementation
- Human decision: OBVIOUS deletion candidates

---

## Component Analysis Summary

**Total Components Analyzed**: 116 React components
**Analysis Iterations**: 4 (V1 → V2 → V3 → V4)

**Final Results**:
- Orphaned (0 refs): 15 components
- Low-use (1-2 refs): 78 components
- Active (3+ refs): 23 components

**Components Deleted**: 7 (all from "orphaned" category)
**Components Kept**: 109 (including 8 remaining orphaned with unclear status)

---

## Restoration Instructions

If any of these components need to be restored:

### AutoSaveExample
1. Copy from: `.archived-code/2025-10-06-story-0.3-phase3/auto-save-example.tsx`
2. Restore to: `apps/web/components/examples/auto-save-example.tsx`
3. Run `bun run typecheck` to verify
4. Test in example/showcase page if needed

### Debug-Logs Components
1. Copy desired component from: `.archived-code/2025-10-06-story-0.3-phase3/{component-name}.tsx`
2. Restore to: `apps/web/components/debug-logs/{component-name}.tsx`
3. Import in `apps/web/app/debug-logs/page.tsx`
4. Run `bun run typecheck` to verify
5. Test debug-logs page functionality

---

## Validation Performed

**Static Analysis**:
- [x] Zero imports detected (grep with comprehensive patterns)
- [x] Zero JSX usage detected (grep for `<ComponentName>`)
- [x] No barrel export usage found
- [x] No lazy import usage found

**Manual Verification**:
- [x] Checked debug-logs page implementation (uses different components)
- [x] Checked documentation for AutoSaveExample references (none found)
- [x] Verified examples directory is for demo code
- [x] Git history reviewed (debug components created together, never wired up)

**Human Approval**:
- [x] User confirmed: "go with obvious"
- [x] Classification: OBVIOUS deletion candidates
- [x] Backup created before deletion

---

## Analysis Quality Improvements (4 Iterations)

### Iteration History

**V1**: Filename pattern search
- Result: 69 orphaned (78% false positive rate)
- Problem: Missed barrel exports

**V2**: Path-based matching
- Result: Timeout, incomplete
- Problem: Too slow, didn't handle barrel exports

**V3**: Component name extraction
- Result: Only 26 components found
- Problem: Only caught `export const`, missed `export function`

**V4**: Complete pattern recognition (FINAL)
- Result: 116 components analyzed accurately
- Patterns: Both `export const` and `export function`
- Handles: Barrel exports, multiple exports per file, JSX usage

---

## Key Patterns Discovered

### Barrel Exports
40% of components imported via barrel exports:
```typescript
import { StatusBadge } from '@/components/shared';
// NOT: import { StatusBadge } from '@/components/shared/status-badge';
```

### Multiple Exports Per File
```typescript
// status-badge.tsx exports 4 components:
export const StatusBadge: React.FC<Props> = ...
export const IncidentStatusBadge: React.FC<Props> = ...
export const CaptureStatusBadge: React.FC<Props> = ...
export const AnalysisStatusBadge: React.FC<Props> = ...
```

### Export Patterns
- 52%: `export function ComponentName()`
- 48%: `export const ComponentName: React.FC<Props> =`

---

## Remaining Orphaned Components (8 - NOT deleted)

**Why NOT deleted** (insufficient evidence or potential false positives):

1. **ClarificationProgress** - Might be used via component composition
2. **CaptureStatusBadge** - Barrel-exported, might be planned feature
3. **AnalysisStatusBadge** - Barrel-exported, might be planned feature
4. **VersionFlashNotification** - Part of version system, possibly WIP
5. **VersionIndicator** - Part of version system, possibly WIP
6. **OwnerBadge** - Admin feature, low visibility
7. **OwnerProtectionIndicator** - Admin feature, analysis might have false negative
8. **RoleSelector** - Admin feature, low visibility

**Recommendation**: Require runtime profiling or manual testing before deletion.

---

## Context for Future Reference

This cleanup was part of Story 0.3 Phase 3 systematic React component dead code audit.

**Key Learnings**:
- Static analysis alone insufficient for safe component deletion
- False positive rate: 78% in V1, refined through iteration
- Component composition, lazy loading, context patterns hide usage
- Conservative approach: Only delete "obvious" candidates
- Runtime profiling recommended for remaining orphans

**Code Reduction**: 7 components removed (~6% of orphaned, ~6% of total 116)

---

## Files in This Archive

1. `auto-save-example.tsx` - Example component
2. `cleanup-controls.tsx` - Debug-logs POC component
3. `cost-monitoring.tsx` - Debug-logs POC component
4. `database-health.tsx` - Debug-logs POC component
5. `log-search.tsx` - Debug-logs POC component
6. `rate-limit-status.tsx` - Debug-logs POC component
7. `system-health-overview.tsx` - Debug-logs POC component
8. `README.md` - This file

**Total Lines of Code Archived**: ~1,200 lines (estimated)
