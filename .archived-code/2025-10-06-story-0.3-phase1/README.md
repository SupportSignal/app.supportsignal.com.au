# Archived Code - Story 0.3 Phase 1 Dead Code Cleanup

**Date**: October 6, 2025
**Story**: 0.3 - Dead Code Discovery & Cleanup
**Phase**: Phase 1 - Convex Functions

## Why This Code Was Archived

During systematic dead code analysis, these functions/files were found to have **ZERO production usage** (no frontend references, no backend calls, no test usage except where noted).

## Archived Files

### 1. analysis.js (ENTIRE FILE - 11 functions)
**Reason**: Abandoned feature - incident analysis/classification system never completed
**Functions**: createClassification, createIncidentClassification, generateClassifications, getAnalysisMetrics, getAnalysisWorkflowStatus, getByAnalysisId, getClassificationsByIncident, getIncidentClassifications, subscribeToAnalysis, subscribeToClassifications, updateIncidentClassification
**Assessment**: Early POC for incident analysis that was replaced by different implementation

### 2. prompts.js (ENTIRE FILE - 9 functions)  
**Reason**: Superseded by promptManager.js
**Functions**: activatePromptVersion, createPrompt, getActivePrompt, getPromptAnalytics, getPromptPerformanceSummary, getPromptsBySubsystem, getPromptsByWorkflow, getPromptVersion, listActivePrompts
**Assessment**: Old prompt management system replaced by newer promptManager.js implementation

### 3. incidents.js (PARTIAL - 6 orphaned functions)
**Reason**: Unused subscription and utility functions
**Functions Removed**:
- subscribeToCompanyIncidents - Real-time subscription never implemented in frontend
- subscribeToIncident - Real-time subscription never implemented in frontend
- addClarificationQuestion - Unused (getClarificationQuestions IS used)
- deleteIncident - Delete functionality never implemented
- getIncidentDashboard - Different dashboard implementation used
- listByUser - Other list functions used instead
- upsertIncidentNarrative - Create/update pattern used instead

**Assessment**: Mix of planned features and replaced implementations

### 4. Individual Orphaned Functions (5 functions)
**adminUsers.js:searchAllUsers** - Admin search never implemented
**llmTest.js:llmSpeedTest** - One-off speed test function
**internalLogging.js:testWorkerConnection** - Debug/test function
**contextualVariables.js:extractContextualVariables** - Feature not used
**contextualVariables.js:getSuggestedVariables** - Feature not used

**Assessment**: Low-risk individual orphans across multiple files

## Restoration Instructions

If any of this code needs to be restored:

1. Copy the archived file from `.archived-code/2025-10-06-story-0.3-phase1/`
2. Place back in `apps/convex/` (original location)
3. Run `bun run typecheck` to verify
4. Update imports if file structure changed

## Removal Strategy

**Files Deleted Completely**:
- analysis.ts ✅ Removed
- prompts.ts ✅ Removed

**Functions Documented but NOT Deleted** (too risky - interleaved in large files):
- incidents.ts (6 orphaned functions) - Full backup saved
- narratives.ts (4 orphaned functions) - Full backup saved
- questionGenerator.ts (4 phase functions) - Full backup saved

**Rationale**: Functions in large active files left with orphan documentation following POC pattern (like knowledge.ts). Safer than extracting from 1000+ line files. Can be fully removed in future dedicated cleanup.

## Validation Performed

- [x] Zero frontend usage confirmed (grep search - with known limitations for type casts)
- [x] Zero backend usage confirmed (grep search)
- [x] Test usage documented
- [x] Git history preserved (files archived, not deleted from git history)
- [x] Human approval obtained
- [x] Full file backups created for partial removals

## Context for Future Reference

This cleanup was part of Story 0.3 systematic dead code audit following Story 0.2 database schema cleanup. The codebase is evolving from early POC implementations to production-ready patterns.

Total functions removed: 31
- analysis.js: 11 functions
- prompts.js: 9 functions  
- incidents.js: 6 functions (partial file)
- Individual files: 5 functions
