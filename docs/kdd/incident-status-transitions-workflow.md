# Incident Status Transitions Workflow - KDD

## Overview
Knowledge captured during Story 4.1 investigation revealing critical gap in status workflow understanding.

## Problem Discovered
- **Symptom**: 60+ incidents stuck in "Capture Pending" status, 0 in "Analysis Pending" 
- **Root Cause**: Manual user action required in Step 8 for status transition
- **Impact**: Workflow appears broken to users, incidents never progress to analysis

## Status Transition Logic

### Backend Logic (`apps/convex/incidents.ts:596-602`)
```typescript
if (captureStatus === "completed" && analysisStatus === "completed") {
  updates.overall_status = "completed";
} else if (captureStatus === "completed") {
  updates.overall_status = "analysis_pending";  // 👈 Key transition
} else {
  updates.overall_status = "capture_pending";
}
```

### Critical Transition Points

#### 1. Incident Creation
- `overall_status = "capture_pending"`
- `capture_status = "draft"`

#### 2. During 8-Step Workflow
- `capture_status = "in_progress"`  
- `overall_status = "capture_pending"` (unchanged)

#### 3. **CRITICAL MANUAL STEP** - Step 8: Consolidated Report
- **Location**: `apps/web/components/incidents/ConsolidatedReportStep.tsx:442`
- **Action Required**: User must click "Submit for Analysis" button
- **Backend Function**: `submitIncidentForAnalysis` in `apps/convex/aiEnhancement.ts:550`
- **Effect**: Sets `capture_status = "completed"` → Triggers automatic `overall_status = "analysis_pending"`

## User Experience Gap

### The Problem
1. **Users complete Steps 1-7** thinking workflow is done
2. **Step 8 appears optional** or like a "review" step  
3. **"Submit for Analysis" button** not clearly understood as required
4. **Status remains "Capture Pending"** indefinitely

### The Solution Pattern
1. **Clear UX indication** that Step 8 submission is required
2. **Status progression education** for users
3. **Workflow completion validation** before allowing exit

## Implementation Files

### Backend Status Logic
- `apps/convex/incidents.ts` - Core status transition logic
- `apps/convex/aiEnhancement.ts:476` - `submitIncidentForAnalysis` mutation

### Frontend Workflow
- `apps/web/components/incidents/ConsolidatedReportStep.tsx` - Step 8 submission
- `apps/web/components/incidents/IncidentCaptureWorkflow.tsx` - Overall workflow

### Button Requirements for Submission
```typescript
disabled={
  !workflowValidation.all_complete || 
  !enhancedNarrative || 
  isSubmitting || 
  incident.handoff_status === "ready_for_analysis"
}
```

## Testing Validation Checklist

### To Verify Status Transitions Work:
1. ✅ Create new incident
2. ✅ Complete Steps 1-7 of workflow  
3. ✅ Reach Step 8: "Complete Report"
4. ✅ Click "Submit for Analysis" button
5. ✅ Verify incident status changes to "Analysis Pending"

### Edge Cases to Test:
- [ ] Validation failures preventing submission
- [ ] Enhanced narrative requirements
- [ ] Permission-based submission access
- [ ] Workflow completion verification

## Lessons Learned

### UX Design Lessons
- **Critical actions need clear indication** - submission isn't obvious
- **Status progression needs user education** - workflow completion unclear
- **Button placement and labeling matter** - "Submit" could be "Complete Workflow"

### Implementation Lessons  
- **Status transitions need comprehensive logging** for debugging
- **Manual steps in automated workflows** are common failure points
- **User testing critical** for workflow understanding

## Recommendations

### Immediate Improvements
1. **Improve Step 8 UX** - Make submission requirement clearer
2. **Add workflow progress indicators** - Show users what's required
3. **Status transition education** - Help text explaining the process

### Long-term Considerations
1. **Consider auto-submission** for completed workflows
2. **Batch status updates** for abandoned incidents  
3. **Workflow analytics** to track completion rates

## Related Documentation
- [Multi-Tenant Security Patterns](multi-tenant-security-patterns.md)
- [Status Display Consistency Patterns](status-display-consistency-patterns.md)
- Story 4.1: Incident Listing Foundation

---
**Created**: 2025-09-01  
**Source**: Story 4.1 Investigation  
**Author**: Claude Sonnet 4 via Scrum Master Bob