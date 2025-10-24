# Story Acceptance Test 7.6: Incident Capture Site Selection

## Overview
Story Acceptance Testing plan to verify Story 7.6 implementation of smart site selection for incidents with auto-population from participant defaults and manual override capability.

**Story**: Incident Capture Site Selection
**Test Environment**: Development/Production
**Tester**: David Cruwys
**Date**: 2025-10-23

---

## Quick Test Results Checklist

**Tested By**: David Cruwys **Date**: 2025-10-23 **Environment**: Dev ☑ | Prod ☐

| Test ID | Test | Status | Comments/Issues |
|---------|------|--------|-----------------|
| UAT-7.6.1 | Site dropdown visible on incident wizard | ✅ | Fixed field order: Participant → Date/Time → Site → Location |
| UAT-7.6.2 | Site auto-populates from participant | ✅ | Fixed: Backend now returns site_id in participant data |
| UAT-7.6.3 | Green checkmark shows auto-population | ✅ | Confirmed working |
| UAT-7.6.4 | User can override auto-populated site | ✅ | Confirmed working |
| UAT-7.6.5 | Site validation prevents submission | ⚠️ SKIP | Validation exists in code, user marked as not tested |
| UAT-7.6.6 | Edge case: Participant without site_id | ✅ | Code handles gracefully (confirmed via logging) |
| UAT-7.6.7 | Edge case: No participant selected | ⚠️ SKIP | User marked as not tested |
| UAT-7.6.8 | Edge case: Company with one site | ⚠️ SKIP | User marked as not tested |
| UAT-7.6.9 | Site column visible in incident table | ✅ | Confirmed - pin icon removed per user request |
| UAT-7.6.10 | Site filter works in incident search | ✅ | Confirmed working |
| UAT-7.6.11 | Site searchable via text search | ✅ | Confirmed working |
| UAT-7.6.12 | Migration: All incidents have site_id | ✅ | Verified: 84/84 incidents have site_id populated |

**Overall Result**: ☑ PASS | ☐ FAIL | ☐ CONDITIONAL

**Sign-off**: David Cruwys **Date**: 2025-10-23

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
   - **Multiple Sites**: Ensure test company has at least 3 sites (e.g., Primary, Site A, Site B)
   - **Multiple Participants**: Have participants assigned to different sites
   - **Test Users**: Have credentials for frontline_worker and company_admin roles
   - **Existing Incidents**: Some incidents should already exist for table/filter testing

3. **Verify Migration Completion**:
   ```bash
   # Development environment
   bunx convex data incidents --limit 10
   # Expected: All incidents should have site_id populated
   ```

4. **Browser Setup**:
   - Clear browser cache to avoid stale form data
   - Open browser DevTools console to observe auto-population logs

---

## Test Scenarios

### Test Group 1: Site Dropdown & Auto-Population

#### UAT-7.6.1: Site Dropdown Visible on Wizard Page 1
**Objective**: Verify site selection dropdown appears in correct location

**Test Steps**:
1. **Navigate to New Incident**:
   - Login as frontline_worker
   - Navigate to `/new-incident`

2. **Verify Site Dropdown Position**:
   - **Expected**: Site dropdown appears on wizard page 1
   - **Expected**: Positioned between participant selector and event date/time fields
   - **Expected**: Label reads "Site/Location" with red asterisk (required field)
   - **Expected**: Dropdown shows "Select a site..." placeholder initially

3. **Verify Dropdown Data**:
   - Click site dropdown
   - **Expected**: All company sites listed (Primary, Site A, Site B, etc.)
   - **Expected**: Sites sorted alphabetically by name

**Pass Criteria**: ✅ Site dropdown visible, properly positioned, shows all company sites

---

#### UAT-7.6.2: Site Auto-Populates from Participant
**Objective**: Verify site automatically fills when participant is selected

**Test Steps**:
1. **Start with Empty Form**:
   - Navigate to new incident form
   - **Expected**: Site dropdown shows "Select a site..." (empty)

2. **Select Participant with Site Assignment**:
   - Click participant selector
   - Choose participant assigned to "Site A"
   - **Expected**: Site dropdown IMMEDIATELY updates to "Site A"
   - **Expected**: No manual site selection required

3. **Verify Auto-Population Logic**:
   - Open browser console
   - Look for log: `🏢 AUTO-POPULATED SITE`
   - **Expected**: Log shows participant ID, participant name, and site_id

4. **Test Multiple Participants**:
   - Clear participant selection
   - Select different participant assigned to "Site B"
   - **Expected**: Site dropdown updates to "Site B"
   - **Expected**: Previous auto-population is replaced

**Pass Criteria**: ✅ Site auto-populates correctly from participant's site_id

---

#### UAT-7.6.3: Visual Feedback for Auto-Population
**Objective**: Verify green checkmark appears when site auto-populated

**Test Steps**:
1. **Before Participant Selection**:
   - View site dropdown help text
   - **Expected**: Shows "Select the physical site where this incident occurred."

2. **After Participant Selection with Auto-Population**:
   - Select participant with site_id
   - **Expected**: Help text changes to green with checkmark (✓)
   - **Expected**: Text reads: "Auto-filled from participant's default site. You can change this if the incident occurred at a different location."

3. **Verify Feedback Clears on Manual Change**:
   - Manually change site to different location
   - **Expected**: Green checkmark message disappears
   - **Expected**: Standard help text returns

**Pass Criteria**: ✅ Green checkmark feedback shows auto-population, clears on manual change

---

#### UAT-7.6.4: User Can Override Auto-Populated Site
**Objective**: Verify frontline worker can manually change site after auto-population

**Test Steps**:
1. **Auto-Populate Site**:
   - Select participant assigned to "Site A"
   - **Expected**: Site dropdown auto-fills to "Site A"

2. **Override Site Selection**:
   - Click site dropdown
   - Select "Site B" manually
   - **Expected**: Site dropdown changes to "Site B"
   - **Expected**: Override is accepted without issues

3. **Verify Form Accepts Override**:
   - Complete rest of form
   - Submit incident
   - **Expected**: Incident saves with manually selected "Site B" (not participant's default)

4. **Verify No Auto-Revert**:
   - After overriding site, click elsewhere in form
   - **Expected**: Site selection stays as "Site B"
   - **Expected**: No auto-revert back to participant's default

**Pass Criteria**: ✅ User can override auto-populated site and override persists

---

### Test Group 2: Validation & Edge Cases

#### UAT-7.6.5: Site Validation Prevents Submission
**Objective**: Verify site is required and blocks form submission

**Test Steps**:
1. **Test Empty Site Validation**:
   - Fill out incident form
   - Leave site dropdown empty (don't select)
   - Click "Next" or "Continue"
   - **Expected**: Validation error appears: "Please select a site"
   - **Expected**: Form does not proceed to next step

2. **Test Validation Clears on Selection**:
   - Select any site from dropdown
   - **Expected**: Validation error disappears immediately
   - **Expected**: "Next" button becomes active

3. **Test Validation with Auto-Population**:
   - Start new incident
   - Select participant (site auto-populates)
   - **Expected**: No validation error appears
   - **Expected**: Form accepts auto-populated site

**Pass Criteria**: ✅ Site validation enforced, prevents submission, clears on selection

---

#### UAT-7.6.6: Edge Case - Participant Without site_id
**Objective**: Verify graceful handling of participant without site assignment

**Test Steps**:
1. **Create Test Participant** (if needed):
   - **Note**: In current system, all participants should have site_id after Story 7.4
   - If testing migration, may need to temporarily create participant without site_id

2. **Select Participant Without Site**:
   - Select participant without site_id
   - **Expected**: Site dropdown remains at current value or shows placeholder
   - **Expected**: No JavaScript errors in console
   - **Expected**: User can manually select site

3. **Verify Form Still Functional**:
   - Manually select site
   - Complete and submit incident
   - **Expected**: Incident saves successfully with manually selected site

**Pass Criteria**: ✅ Participant without site_id handled gracefully, no errors

---

#### UAT-7.6.7: Edge Case - No Participant Selected
**Objective**: Verify site dropdown works when no participant selected

**Test Steps**:
1. **Start New Incident Without Participant**:
   - Navigate to new incident
   - Do NOT select participant
   - **Expected**: Site dropdown shows all company sites
   - **Expected**: No auto-population occurs

2. **Manual Site Selection**:
   - Manually select site from dropdown
   - **Expected**: Selection accepted
   - **Expected**: No validation errors

3. **Add Participant Later**:
   - After selecting site manually, select participant
   - **Expected**: Auto-population respects existing manual selection
   - **Expected**: Implementation: `site_id: participant.site_id || formData.site_id`

**Pass Criteria**: ✅ Site dropdown functional without participant, manual selection preserved

---

#### UAT-7.6.8: Edge Case - Company with One Site
**Objective**: Verify behavior when company has only one site

**Test Steps**:
1. **Test with Single-Site Company** (if available):
   - Login to company with only "Primary" site
   - Navigate to new incident
   - **Expected**: Site dropdown shows only "Primary"
   - **Expected**: May auto-select "Primary" (acceptable behavior)

2. **Verify No Selection Issues**:
   - Complete incident creation
   - **Expected**: Incident saves with only available site
   - **Expected**: No validation errors

**Pass Criteria**: ✅ Single-site scenario works without issues

---

### Test Group 3: Incident Table & Filtering

#### UAT-7.6.9: Site Column Visible in Incident Table
**Objective**: Verify site information displays in incident listings

**Test Steps**:
1. **Navigate to Incident List**:
   - Login as company_admin or frontline_worker
   - Navigate to `/incidents`

2. **Verify Site Display**:
   - **Expected**: Each incident row shows site information
   - **Expected**: Site displayed with pin emoji: "📍 Site A"
   - **Expected**: Site name appears above location detail
   - **Expected**: Location detail still visible below site name

3. **Verify Site Name Accuracy**:
   - Click on incident to view details
   - Verify site name in table matches site in incident detail
   - **Expected**: Site names are correct and consistent

**Pass Criteria**: ✅ Site information visible in incident table with pin emoji

---

#### UAT-7.6.10: Site Filter Works in Incident Search
**Objective**: Verify site filter correctly filters incidents

**Test Steps**:
1. **Locate Site Filter**:
   - On incidents list page, click "Filters" button
   - **Expected**: Site filter dropdown visible in filter panel
   - **Expected**: Label reads "Site"

2. **Test Site Filter Functionality**:
   - Select "Site A" from site filter
   - **Expected**: Incident table shows only incidents at "Site A"
   - **Expected**: Incident count updates to filtered count

3. **Test "All Sites" Option**:
   - Change filter to "All Sites"
   - **Expected**: All incidents visible again
   - **Expected**: Filter effectively cleared

4. **Test Multiple Filter Combinations**:
   - Combine site filter with status filter (e.g., "Site A" + "Completed")
   - **Expected**: Shows only completed incidents at Site A
   - **Expected**: Filters work together correctly

**Pass Criteria**: ✅ Site filter correctly filters incidents by site

---

#### UAT-7.6.11: Site Searchable via Text Search
**Objective**: Verify site names included in text search

**Test Steps**:
1. **Test Text Search with Site Name**:
   - In incident search bar, type "Site A"
   - **Expected**: Incidents at "Site A" appear in results
   - **Expected**: Site name highlighted or visible in results

2. **Test Partial Site Name**:
   - Search for "Site" (partial)
   - **Expected**: All incidents with "Site" in site name or other fields appear

3. **Verify Search Placeholder**:
   - Check search placeholder text
   - **Expected**: Reads "Search incidents by participant, reporter, site, or location..."
   - **Expected**: "site" mentioned in placeholder

**Pass Criteria**: ✅ Site names searchable via text search

---

### Test Group 4: Data Migration Verification

#### UAT-7.6.12: Migration - All Incidents Have site_id
**Objective**: Verify all existing incidents populated with site_id

**Test Steps**:
1. **Check Development Database**:
   ```bash
   bunx convex data incidents --limit 100
   ```
   - **Expected**: All incidents have `site_id` field populated
   - **Expected**: No `site_id: null` or missing site_id values

2. **Verify Migration Logic**:
   - Check migration logs (if available)
   - **Expected**: Migration prioritized participant's site_id
   - **Expected**: Fallback to Primary site used where participant had no site

3. **Random Incident Spot Check**:
   - View 5-10 random incidents in UI
   - **Expected**: All show site information in incident table
   - **Expected**: Site names are valid company sites
   - **Expected**: No "Unknown Site" or blank site values

4. **Production Verification** (if deploying to production):
   ```bash
   bunx convex run --prod migrations:backfillIncidentSites
   ```
   - **Expected**: Migration completes successfully
   - **Expected**: All production incidents have site_id

**Pass Criteria**: ✅ All incidents (dev and prod) have valid site_id populated

---

## Test Execution Notes

### Browser Console Debugging

**Expected Console Logs (During Auto-Population)**:
```javascript
🏢 AUTO-POPULATED SITE
{
  participantId: "...",
  participantName: "John Smith",
  siteId: "..."
}
```

**Red Flags to Watch For**:
- Empty value warnings from Select component (should be guarded)
- Validation errors appearing prematurely
- Site_id undefined or null errors
- API errors when fetching sites

### Common Issues & Solutions

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Site doesn't auto-populate | Participant missing site_id | Verify participant has site_id in database |
| Validation error on auto-fill | Validation not cleared | Check error clearing in handleParticipantSelect |
| Site filter shows no results | Index not deployed | Redeploy Convex schema |
| Migration not complete | Migration not run | Run bunx convex run migrations:backfillIncidentSites |

---

## Production Deployment Checklist

**Before Production Deployment**:
- [ ] All UAT tests pass in development
- [ ] Migration function tested in development
- [ ] Backup production database (if possible)
- [ ] Verify all production participants have site_id

**Production Deployment Steps**:
1. Deploy Convex schema (includes new site_id field and indexes)
2. Run migration: `bunx convex run --prod migrations:backfillIncidentSites`
3. Verify migration success (check logs for errors)
4. Deploy frontend changes
5. Spot-check 10 production incidents for site information
6. Monitor error logs for 24 hours

**Rollback Plan** (if needed):
- Schema change is backwards compatible (site_id optional)
- Frontend can be rolled back independently
- Migration is idempotent (safe to re-run)

---

## Test Data Recommendations

### Ideal Test Scenario Setup

**Company Setup**:
- Company Name: "Test Care Services"
- Sites: Primary, North Site, South Site, Central Hub

**Participant Setup**:
- Participant 1: John Smith → Primary site
- Participant 2: Emma Johnson → North Site
- Participant 3: Michael Brown → South Site
- Participant 4: Sarah Williams → Central Hub

**Existing Incidents**:
- 5 incidents at Primary site
- 3 incidents at North Site
- 2 incidents at South Site
- 1 incident at Central Hub

This setup allows testing:
- Auto-population from different sites
- Site filtering with varied distribution
- Override capability across multiple sites
- Text search matching different site names

---

## Acceptance Criteria Mapping

| AC | Test Coverage |
|----|---------------|
| AC 1: Site field added to incidents | UAT-7.6.12 (Migration) |
| AC 2: Smart auto-population | UAT-7.6.2, UAT-7.6.3 |
| AC 3: Site override capability | UAT-7.6.4 |
| AC 4: Site dropdown on wizard | UAT-7.6.1 |
| AC 5: Site data from company | UAT-7.6.1 |
| AC 6: Required field validation | UAT-7.6.5 |
| AC 7: Validation enforcement | UAT-7.6.5 |
| AC 8: Migration script | UAT-7.6.12 |
| AC 9: Site in incident list | UAT-7.6.9 |
| AC 10: Site filter | UAT-7.6.10, UAT-7.6.11 |

**Overall Coverage**: 10/10 Acceptance Criteria tested ✅

---

## Additional Verification (Optional)

### Performance Testing
- **Large Company Test**: Test with company that has 20+ sites
- **Expected**: Dropdown loads quickly, no performance degradation

### Accessibility Testing
- **Keyboard Navigation**: Tab through form, verify site dropdown accessible
- **Screen Reader**: Verify site dropdown labeled correctly for screen readers

### Cross-Browser Testing
- **Chrome**: Primary testing browser
- **Safari**: Test on Mac Safari
- **Firefox**: Verify compatibility
- **Mobile**: Test responsive design on mobile device

---

## Post-Test Actions

### If Tests Pass
1. Update Story 7.6 status to "SAT Passed"
2. Schedule production deployment
3. Prepare user communication about new site selection feature

### If Tests Fail
1. Document all failing tests with screenshots
2. Add issues to "Bugs Found During Story Acceptance Testing (SAT)" section of story
3. Create bug fix tasks
4. Re-test after fixes

---

## Notes Section

**Tester Notes**:
```
[Space for tester to add observations, issues, or recommendations]
```

**Performance Observations**:
```
[Note any slow loading, delays, or performance issues]
```

**UI/UX Feedback**:
```
[Note any confusing UI elements, unclear messaging, or improvement suggestions]
```
