# Archived Code - Story 0.3 Phase 2 Dead Code Cleanup

**Date**: October 6, 2025
**Story**: 0.3 - Dead Code Discovery & Cleanup
**Phase**: Phase 2 - Next.js Routes & API Endpoints

## Why This Code Was Archived

During systematic Next.js route dead code analysis with CORRECTED grep patterns (V2), this API endpoint was found to have zero detected usage.

## Archived Routes

### 1. /api/redis-stats (API Route)
**File**: `apps/web/app/api/redis-stats/route.ts`
**Reason**: Zero usage detected, old code (August 5, 2025)
**Function**: Fetches Redis statistics from log ingestion Cloudflare Worker
**Assessment**: Redis monitoring functionality likely superseded or abandoned

**What It Did**:
- Fetched health stats from `NEXT_PUBLIC_LOG_WORKER_URL/health`
- Retrieved recent traces from `/traces/recent` endpoint
- Calculated Redis statistics:
  - Total logs count
  - Active traces count
  - System breakdown (browser, convex, worker, manual)
  - Oldest log age
- Returned JSON response with cache-control headers

**Why Removed**:
- Zero references in codebase (grep search with comprehensive patterns)
- Last modified: August 5, 2025 (3 months old)
- Human decision: REMOVE
- Likely replaced by direct worker access or different monitoring approach

## Restoration Instructions

If this route needs to be restored:

1. Copy the archived file from `.archived-code/2025-10-06-story-0.3-phase2/redis-stats-route.ts`
2. Create directory: `mkdir -p apps/web/app/api/redis-stats`
3. Place file: `cp .archived-code/2025-10-06-story-0.3-phase2/redis-stats-route.ts apps/web/app/api/redis-stats/route.ts`
4. Run `bun run typecheck` to verify
5. Test endpoint: `curl http://localhost:3200/api/redis-stats`

## Phase 2 Analysis Summary

**Total Routes Analyzed**: 40 (37 pages + 2 API routes + 1 root)

**Initial Analysis (V1)**: 18 orphaned routes (INCORRECT - grep pattern missed object properties)
**Corrected Analysis (V2)**: 5 truly orphaned routes
**Human Decisions**:
- ✅ KEEP: `/auth/github/callback` (OAuth required)
- ✅ KEEP: `/auth/google/callback` (OAuth required)
- ✅ KEEP: `/reset-password` (email entry point, infrastructure correct)
- ✅ KEEP: `/api/debug-env` (development utility, recently modified Oct 5)
- ❌ REMOVE: `/api/redis-stats` (this file - old, zero usage)
- ✅ KEEP ALL: 12 low-use routes (accessible from navigation)
- ✅ KEEP ALL: 23 active routes (3+ references)

## Grep Pattern Lessons Learned

**V1 Pattern Error**: Searched for `href="/path"` (JSX attributes only)
**V2 Pattern Fixed**: Searched for `href: '/path'` (object properties in navigation structures)
**Impact**: 13 routes rescued from false "orphaned" classification

**V1 False Positives** (routes that V1 missed but V2 found):
- 10 admin tool pages (linked from admin dashboard `ADMIN_SECTIONS` array)
- 2 development tools (dev, wizard-demo)
- 1 business feature page (analysis, reports, workflows, company-management)

## Validation Performed

- [x] Zero frontend usage confirmed (grep V2 comprehensive patterns)
- [x] Zero backend usage confirmed (checked Convex functions)
- [x] No dynamic fetch patterns found: `fetch(\`/api/redis-stats\`)`
- [x] Git history preserved (file archived, not deleted from history)
- [x] Human approval obtained (user annotation in Phase 2 report)
- [x] Not a critical auth/OAuth route (unlike password-reset, github/google callbacks)

## Context for Future Reference

This cleanup was part of Story 0.3 Phase 2 systematic route dead code audit following Phase 1 Convex functions cleanup.

**Grep Improvement**: Phase 2 required correcting grep patterns to detect both JSX attributes (`href="/path"`) and object properties (`href: '/path'`) to avoid false positives.

**User Feedback Integration**: Password reset route investigation revealed template literal limitations and demonstrated importance of applying domain knowledge over grep results.

Total routes removed: 1 API endpoint
Total routes kept: 39 (including 5 with zero usage but valid reasons - OAuth, email links, dev tools)
