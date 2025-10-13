# Story Acceptance Test 7.5: System-Wide Company Management & Editing

## Overview
Story Acceptance Testing plan to verify Story 7.5 implementation of system-wide company management with critical security fix.

**Story**: System-Wide Company Management & Editing
**Test Environment**: Development (localhost:3200)
**Tester**: David Cruwys
**Date**: 2025-10-13

## Prerequisites

### Setup Steps
1. **Start Development Environment**:
   ```bash
   cd /Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au
   bun dev
   ```

2. **Login as System Admin**:
   - Navigate to http://localhost:3200/login
   - Login with system admin credentials (david@ideasmen.com.au)
   - Verify you have system_admin or demo_admin role

3. **Verify Test Data**:
   - At least one test company with status="test" should exist
   - Multiple companies with different statuses (active, trial, suspended)

## Test Scenarios

### Test Group 1: Security Fix Verification (CRITICAL)

#### SAT-1.1: Permission Architecture Validation
**Objective**: Verify MANAGE_ALL_COMPANIES permission is properly enforced

**Test Steps**:
1. **Verify System Admin Access**:
   - As system admin, navigate to `/admin/companies`
   - **Expected**: Page loads successfully showing company listing

2. **Verify Company Admin Blocked** (if company_admin user available):
   - Login as company_admin user
   - Try to access `/admin/companies`
   - Try to access `/admin/companies/[id]/edit`
   - **Expected**: Unauthorized access message displayed

3. **Verify Stories 7.3 & 7.4 Security Fix**:
   - Navigate to `/admin/companies/[id]/sites`
   - Navigate to `/admin/companies/[id]/participants`
   - **Expected**: System admin can access, company admin cannot

**Pass Criteria**: ✅ Only system_admin and demo_admin can access system-wide company management

---

### Test Group 2: Company Edit Functionality

#### SAT-2.1: Company Edit Form Display
**Objective**: Verify edit form loads correctly with existing data

**Test Steps**:
1. **Navigate to Edit Page**:
   - From company listing, click Edit button on any company
   - URL: `/admin/companies/[id]/edit`
   - **Expected**: Form loads with populated fields:
     - Company Name (filled)
     - Contact Email (filled)
     - Status (selected)
     - Slug (read-only, grayed out)
     - Created Date (read-only, grayed out)

2. **Verify Read-Only Fields**:
   - Try to modify Slug field
   - **Expected**: Field is disabled and cannot be changed

**Pass Criteria**: ✅ Edit form displays with correct data and field states

#### SAT-2.2: Company Edit Validation
**Objective**: Verify client-side and server-side validation

**Test Steps**:
1. **Test Required Field Validation**:
   - Clear Company Name field
   - Click "Save Changes"
   - **Expected**: Error message "Company name is required"

2. **Test Email Format Validation**:
   - Enter invalid email: "notanemail"
   - Click "Save Changes"
   - **Expected**: Error message "Valid email address is required"

3. **Test Field Length Validation**:
   - Enter company name longer than 100 characters
   - Click "Save Changes"
   - **Expected**: Error message "Company name must be 100 characters or less"

4. **Test Real-Time Error Clearing**:
   - Trigger validation error
   - Start typing in the field
   - **Expected**: Error message clears as you type

**Pass Criteria**: ✅ All validation rules work correctly with proper error messages

#### SAT-2.3: Company Edit Success Flow
**Objective**: Verify successful company update

**Test Steps**:
1. **Update Company Details**:
   - Change company name to "[Original Name] - Updated"
   - Change contact email to different valid email
   - Change status to different value
   - Click "Save Changes"
   - **Expected**:
     - Toast notification "Company updated successfully"
     - Redirect to company listing page
     - Updated company appears in list with new values

2. **Verify Persistence**:
   - Navigate back to edit page for same company
   - **Expected**: Updated values are displayed

**Pass Criteria**: ✅ Company updates save correctly and persist

#### SAT-2.4: Company Edit Cancel Flow
**Objective**: Verify cancel functionality

**Test Steps**:
1. **Cancel Without Changes**:
   - Navigate to edit page
   - Click "Cancel" button
   - **Expected**: Return to company listing without changes

2. **Cancel With Unsaved Changes**:
   - Navigate to edit page
   - Make changes to name field
   - Click "Cancel" button
   - **Expected**: Return to listing, changes discarded

**Pass Criteria**: ✅ Cancel returns to listing without saving changes

---

### Test Group 3: Company Listing & System Metrics

#### SAT-3.1: System Metrics Dashboard
**Objective**: Verify system metrics display correctly

**Test Steps**:
1. **View Metrics Cards**:
   - Navigate to `/admin/companies`
   - Observe top metrics cards
   - **Expected**: Five metric cards displayed:
     - Companies (count)
     - Users (count)
     - Participants (count)
     - Sites (count)
     - Incidents (count)

2. **Verify Metric Accuracy**:
   - Count companies manually in listing
   - **Expected**: Metrics match actual counts

**Pass Criteria**: ✅ System metrics display accurate counts

#### SAT-3.2: Company Listing Display
**Objective**: Verify company table displays correctly

**Test Steps**:
1. **View Company Table**:
   - Observe company listing table
   - **Expected**: Table shows columns:
     - Company (name, email, slug)
     - Status (badge)
     - Users Count (clickable link)
     - Participants Count (clickable link)
     - Sites Count (clickable link)
     - Active Incidents (count)
     - Created (date)
     - Actions (Edit button, Delete button for test companies)

2. **Verify Status Badges**:
   - **Expected**: Status badges have correct colors:
     - Active: green (default variant)
     - Trial: blue (secondary variant)
     - Suspended: red (destructive variant)
     - Test: gray (outline variant)

3. **Verify Count Links**:
   - Click on Users count
   - **Expected**: Navigate to users page for that company
   - Repeat for Participants and Sites

**Pass Criteria**: ✅ Company listing displays all required information with proper formatting

#### SAT-3.3: Search and Filter Functionality
**Objective**: Verify search and filter controls work correctly

**Test Steps**:
1. **Test Search Filter**:
   - Type company name (partial match) in search box
   - **Expected**: Table updates to show only matching companies

2. **Test Status Filter**:
   - Select "Active" from status dropdown
   - **Expected**: Only active companies displayed
   - Change to "Test"
   - **Expected**: Only test companies displayed
   - Select "All statuses"
   - **Expected**: All companies displayed

3. **Test Combined Filters**:
   - Select status filter AND enter search query
   - **Expected**: Results match BOTH criteria

4. **Test Clear Filters**:
   - Apply search and status filters
   - Click "Clear Filters" button
   - **Expected**: All filters reset, full list displayed

**Pass Criteria**: ✅ Search and filters work correctly individually and combined

---

### Test Group 4: Test Company Cleanup

#### SAT-4.1: Cleanup Button Visibility
**Objective**: Verify delete button only appears for test companies

**Test Steps**:
1. **Check Active Company**:
   - Find company with status="active"
   - Look for trash/delete button in Actions column
   - **Expected**: No delete button visible

2. **Check Test Company**:
   - Find company with status="test"
   - Look for trash/delete button in Actions column
   - **Expected**: Red delete button (trash icon) visible

**Pass Criteria**: ✅ Delete button only appears for companies with status="test"

#### SAT-4.2: Cleanup Preview Flow
**Objective**: Verify cleanup preview modal

**Test Steps**:
1. **Open Cleanup Dialog**:
   - Click delete button on test company
   - **Expected**: Dialog opens with:
     - Warning message "This action cannot be undone"
     - Company name displayed
     - "Preview Data to be Deleted" button
     - "Cancel" button

2. **View Cleanup Preview**:
   - Click "Preview Data to be Deleted"
   - Wait for data to load
   - **Expected**: Preview shows breakdown:
     - Sites: count and list of names
     - Users: count and list of emails
     - Participants: count and list of names
     - Incidents: count
     - User Invitations: count
     - Sessions: count
     - Total Records: sum of all
   - All counts should be accurate

**Pass Criteria**: ✅ Preview displays detailed breakdown of data to be deleted

#### SAT-4.3: Cleanup Confirmation Requirements
**Objective**: Verify multi-step confirmation process

**Test Steps**:
1. **Test Confirmation Input**:
   - After viewing preview, observe confirmation input
   - Try clicking "Confirm Deletion" without typing
   - **Expected**: Button is disabled

2. **Test Incorrect Name Entry**:
   - Type wrong company name
   - **Expected**: Button remains disabled

3. **Test Correct Name Entry**:
   - Type exact company name
   - **Expected**: "Confirm Deletion" button becomes enabled

**Pass Criteria**: ✅ Confirmation requires exact company name match

#### SAT-4.4: Cleanup Execution (CAUTION: Destructive)
**Objective**: Verify cleanup execution works correctly

**⚠️ WARNING**: This test deletes data. Only use test company with test data.

**Test Steps**:
1. **Execute Cleanup**:
   - Complete preview and confirmation steps
   - Click "Confirm Deletion" button
   - **Expected**:
     - Button shows "Deleting..." with spinner
     - Dialog stays open during deletion
     - After completion: success toast appears
     - Redirect to company listing
     - Deleted company no longer appears in list

2. **Verify Cascade Deletion**:
   - Try to access deleted company's sites page
   - Try to access deleted company's users page
   - **Expected**: All related data is gone (404 or empty)

**Pass Criteria**: ✅ Cleanup deletes company and all related data successfully

#### SAT-4.5: Cleanup Safety Validation
**Objective**: Verify only test companies can be deleted

**Test Steps**:
1. **Attempt Backend Bypass** (Optional - requires Convex dashboard):
   - In Convex dashboard, try to run `executeTestCompanyCleanup`
   - Use non-test company ID (status="active")
   - **Expected**: Error "Only test companies can be deleted"

**Pass Criteria**: ✅ Backend prevents deletion of non-test companies

---

### Test Group 5: Edge Cases and Error Handling

#### SAT-5.1: Navigation and Cancel Flows
**Objective**: Verify proper navigation throughout the feature

**Test Steps**:
1. **Test Back Navigation**:
   - From company listing, click Edit button
   - Click "← Back to Companies" link at top
   - **Expected**: Return to listing

2. **Test Cancel During Cleanup**:
   - Start cleanup flow (open dialog)
   - Click "Cancel" button
   - **Expected**: Dialog closes, no changes made

**Pass Criteria**: ✅ All navigation and cancel options work correctly

#### SAT-5.2: Empty States
**Objective**: Verify appropriate messaging for empty results

**Test Steps**:
1. **Test No Search Results**:
   - Enter search query that matches no companies
   - **Expected**: Message "No companies found. Try adjusting your filters."

2. **Test Empty Company List** (if possible in clean database):
   - **Expected**: Message "No companies found. Create your first company to get started."

**Pass Criteria**: ✅ Appropriate empty state messages displayed

#### SAT-5.3: Error Handling
**Objective**: Verify error scenarios display proper messages

**Test Steps**:
1. **Test Network Error Simulation** (disconnect network):
   - Try to save company edit
   - **Expected**: Error toast with meaningful message

2. **Test Invalid Data Handling**:
   - Submit form with invalid data patterns
   - **Expected**: Validation errors displayed, not server crash

**Pass Criteria**: ✅ Errors are handled gracefully with user-friendly messages

---

## Test Results Template

### Test Execution Summary
- **Test Date**: _________
- **Environment**: Development (localhost:3200)
- **Tester**: David Cruwys
- **Story Version**: 7.5 Complete (October 13, 2025)

| Test Group | Test Case | Status | Notes |
|------------|-----------|---------|-------|
| 1.1 | Permission Architecture Validation | ⏳ | CRITICAL - Security fix |
| 2.1 | Company Edit Form Display | ⏳ | |
| 2.2 | Company Edit Validation | ⏳ | |
| 2.3 | Company Edit Success Flow | ⏳ | |
| 2.4 | Company Edit Cancel Flow | ⏳ | |
| 3.1 | System Metrics Dashboard | ⏳ | |
| 3.2 | Company Listing Display | ⏳ | |
| 3.3 | Search and Filter Functionality | ⏳ | |
| 4.1 | Cleanup Button Visibility | ⏳ | |
| 4.2 | Cleanup Preview Flow | ⏳ | |
| 4.3 | Cleanup Confirmation Requirements | ⏳ | |
| 4.4 | Cleanup Execution | ⏳ | ⚠️ DESTRUCTIVE - Use test data |
| 4.5 | Cleanup Safety Validation | ⏳ | |
| 5.1 | Navigation and Cancel Flows | ⏳ | |
| 5.2 | Empty States | ⏳ | |
| 5.3 | Error Handling | ⏳ | |

### Overall Status
- ⏳ **Pending**: Ready for execution
- Target: ✅ **All tests passing**

## Notes for Tester

### Critical Security Testing:
1. **Permission Fix is CRITICAL**: Test Group 1 validates security vulnerability fix from Stories 7.3 & 7.4
2. **Test with multiple roles**: If possible, test with both system_admin and company_admin accounts
3. **Verify isolation**: Ensure company_admin cannot access system-wide company management

### Test Company Setup:
1. **Before Cleanup Tests**: Create a dedicated test company with:
   - Status: "test"
   - Some test users, sites, participants
   - Use this for cleanup testing (SAT-4.4)
2. **Don't delete production data**: Double-check company status before cleanup

### Common Issues to Watch For:
1. **Select Component**: Status filter should work without empty string errors
2. **Badge Colors**: Verify status badges match design (green=active, blue=trial, red=suspended, gray=test)
3. **Count Accuracy**: System metrics and table counts should match
4. **Cascade Deletion**: Cleanup should remove ALL related data, not just company record

### Success Criteria:
- All 16 test cases pass
- Security fix validated (CRITICAL)
- No unauthorized access possible
- All CRUD operations work correctly
- Cleanup system safely deletes test companies only

### Files to Reference:
- Backend: `apps/convex/companies/admin.ts`
- Frontend Listing: `apps/web/app/admin/companies/page.tsx`
- Frontend Edit: `apps/web/app/admin/companies/[id]/edit/page.tsx`
- Cleanup Dialog: `apps/web/components/admin/company-cleanup-dialog.tsx`
- Validation: `apps/convex/lib/validation.ts`
- Permissions: `apps/convex/permissions.ts`

### Next Steps After Story Acceptance Testing:
- If all tests pass: Story 7.5 ready for production deployment
- If issues found: Document bugs and prioritize fixes
- Verify Stories 7.3 & 7.4 security fix in production
- Begin Epic 7 completion validation (all stories 7.1-7.5 complete)
