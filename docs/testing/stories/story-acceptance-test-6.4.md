# Story Acceptance Test 6.4: Phase-Specific Narrative Enhancement with Auto-Trigger

## Overview
Story Acceptance Testing plan to verify Story 6.4 implementation of phase-specific AI narrative enhancement with automatic triggering and developer testing controls.

**Story**: Phase-Specific Narrative Enhancement with Auto-Trigger
**Test Environment**: Development/Production
**Tester**: David Cruwys
**Date**: 2025-10-15

---

## Quick Test Results Checklist


**Tested By**: _________________ **Date**: __________ **Environment**: Dev ☐ | Prod ☐

| Test ID | Test | Status | Comments/Issues |
|---------|------|--------|-----------------|
| UAT-6.4.1 | All 4 prompts visible in admin interface    | YES |  |
| UAT-6.4.2 | Narratives auto-enhance on page load        | YES |  |
| UAT-6.4.3 | Smart caching - no duplicate enhancement    | YES |  |
| UAT-6.4.4 | Developer controls visible & functional     | YES |  |
| UAT-6.4.5 | Regular users don't see dev controls        | YES |  |
| UAT-6.4.6 | Before event enhancement quality            | yes |  |
| UAT-6.4.7 | During event enhancement quality            | yes |  |
| UAT-6.4.8 | End event enhancement quality               | yes |  |
| UAT-6.4.9 | Post event enhancement quality              | yes |  |
| UAT-6.4.10 | Loading indicators show during processing  |     | BLOCKED: Need to implement card-level loading state (Subtask 6.4.3.6-6.4.3.9) |
| UAT-6.4.11 | Error handling works gracefully            |     | PENDING: Test after loading states implemented |
| UAT-6.4.12 | Backend selects correct prompts            |     | CAN TEST: Backend already selects correct phase-specific prompts |


## Remaining Work (Story 6.4)

**Next Priority - Loading State Implementation:**
- [ ] Subtask 6.4.3.6: Design loading state pattern (card-level for 2-5 second delays)
- [ ] Subtask 6.4.3.7: Implement card-level loading overlay on narrative cards during auto-enhancement
- [ ] Subtask 6.4.3.8: Test with realistic delays (currently 5+ seconds with no visual feedback)
- [ ] Subtask 6.4.3.9: Document loading pattern in docs/patterns/ for reuse

**After Loading States:**
- [ ] Complete UAT-6.4.10, UAT-6.4.11, UAT-6.4.12 testing
- [ ] Task 6.4.5: Testing and validation (comprehensive test suite)
- [ ] Task 6.4.6: Documentation (KDD process, patterns documentation)

**Extra Notes:**
1. Original template (`enhance_narrative`) could probably be removed after testing completes
2. Consider removing debug logs/variables if any remain in production code


**Overall Result**: ☐ PASS | ☐ FAIL | ☐ CONDITIONAL

**Sign-off**: _________________ **Date**: _________

---

## Prerequisites

### Setup Steps
1. **Start Development Environment**:
   ```bash
   pwd  # Verify: /Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au
   bun convex:dev     # Terminal 1
   bun web:dev        # Terminal 2
   ```

2. **Prepare Test Data**:
   - Have at least one company with sites
   - Have at least one participant with site assignment
   - Have valid user credentials (system_admin for prompt verification, company_admin for incident workflow)

3. **Verify Prompt Seeding**:
   - Check that 4 new enhancement prompts exist in database:
     - `enhance_narrative_before_event`
     - `enhance_narrative_during_event`
     - `enhance_narrative_end_event`
     - `enhance_narrative_post_event`

## Test Scenarios

### Test Group 1: Admin Interface Verification

#### UAT-6.4.1: Prompt Templates in Admin Interface
**Objective**: Verify all 4 phase-specific enhancement prompts visible in admin interface

**Test Steps**:
1. **Login as System Admin**:
   - Navigate to `/admin/ai-prompts`
   - Login with system admin credentials

2. **Verify Prompt List**:
   - Search/filter for "enhance_narrative"
   - **Expected**: See 4 prompts:
     - `enhance_narrative_before_event` - "Before Event Narrative Enhancement"
     - `enhance_narrative_during_event` - "During Event Narrative Enhancement"
     - `enhance_narrative_end_event` - "End Event Narrative Enhancement"
     - `enhance_narrative_post_event` - "Post Event Narrative Enhancement"

3. **Verify Prompt Details**:
   - Click on each prompt to view details
   - **Expected**: Each prompt has:
     - Subsystem: "incidents"
     - Status: "active"
     - Phase-specific focus areas in prompt template (no generic `{{narrative_phase}}` variable)

**Pass Criteria**: ✅ All 4 prompts visible, active, and contain phase-specific content

---

### Test Group 2: Auto-Trigger Enhancement Testing

#### UAT-6.4.2: Automatic Enhancement on Page Load
**Objective**: Verify narratives automatically enhance when clarifications complete

**Test Steps**:
1. **Start New Incident**:
   - Navigate to `/new-incident`
   - Login as company_admin
   - Complete Step 1 (Initial Report)

2. **Complete Clarification Questions**:
   - Complete Step 2 clarification questions for all 4 phases
   - Answer all questions with substantive content
   - Click "Continue to Review & Submit"

3. **Observe Auto-Enhancement**:
   - **Expected**: On Step 3 (Enhanced Review), narratives automatically enhance
   - **Expected**: See loading indicators during enhancement
   - **Expected**: Enhanced narratives appear in review cards
   - **Expected**: No manual "Enhance" buttons visible (unless logged in as developer)

4. **Verify All Phases Enhanced**:
   - Check "Before Event" narrative shows enhanced version
   - Check "During Event" narrative shows enhanced version
   - Check "End Event" narrative shows enhanced version
   - Check "Post Event" narrative shows enhanced version

**Pass Criteria**: ✅ All 4 phases auto-enhance without manual intervention

#### UAT-6.4.3: Smart Caching - No Duplicate Enhancement
**Objective**: Verify narratives don't re-enhance on page refresh

**Test Steps**:
1. **After Auto-Enhancement Completes**:
   - Note the content of all 4 enhanced narratives
   - Refresh the page (F5 or Cmd+R)

2. **Verify No Re-Enhancement**:
   - **Expected**: Page loads with existing enhanced narratives
   - **Expected**: No loading indicators appear
   - **Expected**: No API calls to enhancement endpoint
   - **Expected**: Content matches pre-refresh enhanced narratives

3. **Check Browser DevTools**:
   - Open Network tab, filter for "enhance"
   - Refresh page
   - **Expected**: Zero enhancement API calls

**Pass Criteria**: ✅ Enhanced narratives cached, no duplicate processing on refresh

---

### Test Group 3: Developer Controls Testing

#### UAT-6.4.4: Developer Access to Manual Controls
**Objective**: Verify developer regenerate buttons work and are properly gated

**Test Steps**:
1. **Login as Developer User**:
   - Login with user that has `hasDeveloperAccess` permissions
   - Navigate to incident review step with enhanced narratives

2. **Verify Developer Controls Visible**:
   - **Expected**: See "Enhance All (Dev)" button at top of page
   - **Expected**: See individual "Enhance (Dev)" buttons on each phase card
   - **Expected**: Buttons only visible when logged in as developer

3. **Test Individual Phase Regenerate**:
   - Click "Enhance (Dev)" button on "Before Event" phase
   - **Expected**: Loading spinner appears on button
   - **Expected**: Narrative re-enhances (may change slightly due to AI variability)
   - **Expected**: Enhanced content updates in card

4. **Test Enhance All Button**:
   - Click "Enhance All (Dev)" button
   - **Expected**: All 4 phases show loading indicators sequentially
   - **Expected**: All 4 narratives re-enhance
   - **Expected**: Content updates across all phases

**Pass Criteria**: ✅ Developer controls work, properly gated by permissions

#### UAT-6.4.5: Regular User - No Manual Controls
**Objective**: Verify regular users don't see developer controls

**Test Steps**:
1. **Login as Regular User**:
   - Login with company_admin (non-developer) credentials
   - Navigate to incident review step

2. **Verify No Developer Controls**:
   - **Expected**: No "Enhance All (Dev)" button visible
   - **Expected**: No individual "Enhance (Dev)" buttons visible
   - **Expected**: Only see auto-enhanced narratives with status badges

**Pass Criteria**: ✅ Developer controls hidden from regular users

---

### Test Group 4: Phase-Specific Enhancement Quality

#### UAT-6.4.6: Before Event Enhancement Focus
**Objective**: Verify before_event prompt produces relevant enhancements

**Test Steps**:
1. **Create Incident with Before Event Content**:
   - Original narrative: "Participant seemed agitated during breakfast. Staff noticed he was pacing."
   - Complete clarifications focusing on: environment, mood, early warning signs

2. **Review Enhanced Narrative**:
   - **Expected**: Enhancement includes:
     - Environmental context (breakfast time, location details)
     - Participant state description (agitation, pacing behavior)
     - Early warning signs identified
     - Staff observations expanded
   - **Expected**: Enhancement does NOT focus on interventions or follow-up (those are other phases)

**Pass Criteria**: ✅ Enhancement focuses on before-event context appropriately

#### UAT-6.4.7: During Event Enhancement Focus
**Objective**: Verify during_event prompt produces relevant enhancements

**Test Steps**:
1. **Review During Event Enhanced Narrative**:
   - **Expected**: Enhancement includes:
     - Staff actions and interventions attempted
     - Safety measures taken
     - Timeline of what happened
     - What helped or didn't help
   - **Expected**: Enhancement focuses on active incident response

**Pass Criteria**: ✅ Enhancement focuses on during-event actions appropriately

#### UAT-6.4.8: End Event Enhancement Focus
**Objective**: Verify end_event prompt produces relevant enhancements

**Test Steps**:
1. **Review End Event Enhanced Narrative**:
   - **Expected**: Enhancement includes:
     - How the situation was resolved
     - De-escalation techniques used
     - When/how participant calmed down
     - Immediate aftermath details
   - **Expected**: Enhancement focuses on resolution process

**Pass Criteria**: ✅ Enhancement focuses on end-event resolution appropriately

#### UAT-6.4.9: Post Event Enhancement Focus
**Objective**: Verify post_event prompt produces relevant enhancements

**Test Steps**:
1. **Review Post Event Enhanced Narrative**:
   - **Expected**: Enhancement includes:
     - Follow-up care provided
     - Safety checks performed
     - Support plan modifications
     - Notifications sent
     - Lessons learned
   - **Expected**: Enhancement focuses on post-event actions

**Pass Criteria**: ✅ Enhancement focuses on post-event follow-up appropriately

---

### Test Group 5: Loading States & User Experience

#### UAT-6.4.10: Loading Indicators During Enhancement
**Objective**: Verify loading states appear during processing

**Test Steps**:
1. **Observe Auto-Enhancement Process**:
   - Start incident and complete clarifications
   - Navigate to review step
   - **Expected**: See loading indicators appear on narrative cards
   - **Expected**: Loading message indicates which phase is enhancing
   - **Expected**: Loading prevents form interaction during processing

2. **Test Developer Manual Enhancement**:
   - Click "Enhance (Dev)" button
   - **Expected**: Button shows loading spinner
   - **Expected**: Button disabled during processing
   - **Expected**: Loading state clears when enhancement completes

**Pass Criteria**: ✅ Loading states provide clear visual feedback

#### UAT-6.4.11: Error Handling
**Objective**: Verify graceful error handling if AI service fails

**Test Steps**:
1. **Test with Invalid API Key** (if possible in dev environment):
   - Temporarily break OpenAI API access
   - Attempt enhancement
   - **Expected**: Error message displayed to user
   - **Expected**: Loading state clears
   - **Expected**: Original narrative remains visible
   - **Expected**: User can continue workflow

2. **Restore Normal Operation**:
   - Fix API access
   - Verify enhancement works again

**Pass Criteria**: ✅ Errors handled gracefully without breaking workflow

---

### Test Group 6: Backend API Verification

#### UAT-6.4.12: Dynamic Prompt Selection
**Objective**: Verify backend selects correct prompt per phase

**Test Steps**:
1. **Check Backend Logs**:
   - Trigger enhancement for each phase
   - Check Convex logs (via `bunx convex logs`)
   - **Expected**: See log entries showing correct prompt selected:
     - Before Event → `enhance_narrative_before_event`
     - During Event → `enhance_narrative_during_event`
     - End Event → `enhance_narrative_end_event`
     - Post Event → `enhance_narrative_post_event`

2. **Verify API Compatibility**:
   - **Expected**: Existing `enhanceNarrativePhase` function signature unchanged
   - **Expected**: No breaking changes to frontend integration

**Pass Criteria**: ✅ Backend correctly selects phase-specific prompts
