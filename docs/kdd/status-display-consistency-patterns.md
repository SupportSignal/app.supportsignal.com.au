# Status Display Consistency Patterns - KDD

## Overview
UI consistency patterns discovered and fixed during Story 4.1 status alignment investigation.

## Problem Identified
**Symptom**: Filter dropdown and table badge statuses didn't match, creating user confusion.

### Before Fix (Inconsistent)
- **Filter dropdown**: "Capture Pending", "Analysis Pending", "Completed" 
- **Status badge**: "Draft", "In Progress", "Capture Complete", "Ready for Analysis", "Completed"
- **User Experience**: Filtering by "Capture Pending" showed badges saying "In Progress" or "Draft"

### After Fix (Consistent) ✅
- **Filter dropdown**: "Capture Pending", "Analysis Pending", "Completed"
- **Status badge**: "Capture Pending", "Analysis Pending", "Completed"  
- **User Experience**: Filter and badge labels match exactly

## Root Cause Analysis

### Source of Truth (Database Schema)
```typescript
// apps/convex/schema.ts
overall_status: v.union(
  v.literal("capture_pending"), 
  v.literal("analysis_pending"), 
  v.literal("completed")
)
```

### The Bug Location
**File**: `apps/web/components/incidents/IncidentStatusBadge.tsx`

```typescript
// ❌ BEFORE: Dynamic sub-status labels (inconsistent)
case "capture_pending":
  return {
    label: getProgressLabel(captureStatus), // "Draft", "In Progress", etc.
    variant: "secondary" as const,
    icon: <ClockIcon className="w-3 h-3" />,
    progress: getProgressValue(captureStatus)
  };

// ✅ AFTER: Consistent overall status labels
case "capture_pending":
  return {
    label: "Capture Pending", // Matches filter exactly
    variant: "secondary" as const,
    icon: <ClockIcon className="w-3 h-3" />,
    progress: getProgressValue(captureStatus)
  };
```

## UI Consistency Pattern

### Rule 1: Single Source of Truth
- **Database schema defines status values** - All UI follows schema
- **No UI-specific status transformations** - Display what's stored  
- **Status logic in backend only** - Frontend renders, doesn't interpret

### Rule 2: Consistent Labeling Across Components
```typescript
// Status value mapping (consistent everywhere)
const STATUS_LABELS = {
  "capture_pending": "Capture Pending",
  "analysis_pending": "Analysis Pending", 
  "completed": "Completed"
};
```

### Rule 3: Progress vs Status Separation  
- **Overall Status** = High-level workflow state ("Capture Pending")
- **Progress Details** = Step-by-step completion ("Step 3 of 8", "60% complete")
- **Display both** but keep overall status consistent across components

## Implementation Pattern for Status Display

### Correct Component Structure
```typescript
export function StatusDisplay({ overallStatus, captureStatus, analysisStatus }) {
  // Always use overall status for primary label
  const primaryLabel = STATUS_LABELS[overallStatus];
  
  // Use sub-statuses for progress details only
  const progressDetails = getProgressDetails(captureStatus);
  
  return (
    <div>
      <Badge>{primaryLabel}</Badge>  {/* Consistent with filters */}
      {overallStatus === "capture_pending" && (
        <ProgressBar value={progressDetails.percentage} />
      )}
    </div>
  );
}
```

### Filter Component Alignment
```typescript
// Filter options must match badge labels exactly
<SelectContent>
  <SelectItem value="all">All Statuses</SelectItem>
  <SelectItem value="capture_pending">Capture Pending</SelectItem>    {/* Matches badge */}
  <SelectItem value="analysis_pending">Analysis Pending</SelectItem>  {/* Matches badge */}
  <SelectItem value="completed">Completed</SelectItem>                {/* Matches badge */}
</SelectContent>
```

## Files Impacted by Consistency Fix

### ✅ Files Already Consistent (No Changes Needed)
- `apps/web/components/incidents/IncidentFilters.tsx` - Filter dropdown labels correct
- `apps/web/components/incidents/IncidentListPage.tsx` - Dashboard cards consistent
- `apps/convex/incidents_listing.ts` - Backend returns correct status values

### ✅ Files Fixed During Story 4.1  
- `apps/web/components/incidents/IncidentStatusBadge.tsx` - Status labels now match filters

## Testing Checklist for Status Consistency

### Visual Consistency Tests
- [ ] Filter by "Capture Pending" → All badges show "Capture Pending"
- [ ] Filter by "Analysis Pending" → All badges show "Analysis Pending" 
- [ ] Filter by "Completed" → All badges show "Completed"
- [ ] Dashboard summary cards match filter labels
- [ ] Status progression follows schema values exactly

### Data Flow Tests
- [ ] Backend queries use schema status values
- [ ] Frontend receives schema values unchanged  
- [ ] UI components render schema values consistently
- [ ] No status value transformation in frontend

## Common Status Display Anti-Patterns

### ❌ Don't Do These
```typescript
// Translating status values in frontend
const getDisplayStatus = (status) => {
  switch(status) {
    case "capture_pending": return "In Progress";  // Creates inconsistency
    case "analysis_pending": return "Ready for Review"; // Different from filter
  }
};

// Using sub-status for main display
<Badge>{captureStatus}</Badge> // Shows "draft", "in_progress" instead of overall status

// Filter and display mismatch
<SelectItem value="capture_pending">In Progress</SelectItem> // Doesn't match badge
```

### ✅ Always Do These  
```typescript
// Use schema values directly
<Badge>{overallStatus}</Badge> // Shows "capture_pending" → "Capture Pending"

// Consistent labeling function
const getStatusLabel = (status) => STATUS_LABELS[status]; // Same mapping everywhere

// Match filter and display exactly
<SelectItem value="capture_pending">Capture Pending</SelectItem> // Matches badge exactly
```

## Status vs Progress Display Pattern

### Primary Status (Always Consistent)
- **Purpose**: High-level workflow state
- **Values**: Schema-defined overall_status  
- **Display**: Badge, filter options, dashboard cards
- **Consistency Rule**: Same label everywhere

### Secondary Progress (Context-Specific)
- **Purpose**: Detailed completion information
- **Values**: Calculated from capture_status, analysis_status
- **Display**: Progress bars, step indicators, tooltips  
- **Flexibility**: Can vary by context for UX

### Example Implementation
```typescript
<div className="status-display">
  {/* Primary status - consistent everywhere */}
  <Badge variant={getStatusVariant(overallStatus)}>
    {getStatusLabel(overallStatus)}
  </Badge>
  
  {/* Secondary progress - context-specific */}
  {overallStatus === "capture_pending" && (
    <div className="progress-details">
      <ProgressBar value={getProgressPercentage(captureStatus)} />
      <span className="text-xs">{getProgressStepText(captureStatus)}</span>
    </div>
  )}
</div>
```

## Future Consistency Guidelines

### When Adding New Status Values
1. **Update schema first** - Define in database schema
2. **Add to STATUS_LABELS mapping** - Consistent display text
3. **Update all filter components** - Add filter option
4. **Update all status badge components** - Add badge rendering
5. **Test consistency** - Ensure filter and badge match

### When Adding New Status Display Components
1. **Use STATUS_LABELS mapping** - Don't create new status text
2. **Follow primary/secondary pattern** - Overall status primary, progress secondary
3. **Test with all status values** - Ensure all statuses display correctly
4. **Verify filter consistency** - New component matches existing filters

## Lessons Learned

### Design Insights
- **Status granularity vs consistency trade-off** - Users prefer consistency over detail
- **Filter-display alignment critical** - Mismatches break user mental models
- **Schema as single source of truth** - Don't interpret data in frontend

### Implementation Insights  
- **Centralized status labeling** - One mapping function prevents divergence
- **Status display auditing** - Regular checks for consistency across components
- **User testing for status understanding** - Labels should match user expectations

## Related Documentation
- [Incident Status Transitions Workflow](incident-status-transitions-workflow.md)
- [Multi-Tenant Security Patterns](multi-tenant-security-patterns.md)
- Story 4.1: Incident Listing Foundation

---
**Created**: 2025-09-01  
**Source**: Story 4.1 Status Alignment Investigation  
**Author**: Claude Sonnet 4 via Scrum Master Bob