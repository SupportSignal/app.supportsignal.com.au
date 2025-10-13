# Story 7.5 Additional Bugs Found During Testing

**Discovered**: October 13, 2025 during SAT execution by David Cruwys
**Context**: Story 7.5 just deployed, user running Story Acceptance Tests

---

## Bug 1: Status Field Not Auto-Selected on Edit Form

### Location
`apps/web/app/admin/companies/[id]/edit/page.tsx`

### Description
When editing a company, the Status dropdown shows no selection even though the company has a saved status value. The field appears blank/unselected.

**URL**: `http://localhost:3200/admin/companies/[id]/edit/`

### Root Cause
**Same pattern as Story 7.4 bug** (documented in `auto-selection-validation-error-bug.md`)

The useEffect populates form data but the Select component doesn't recognize the value:

```typescript
// Current code (lines 44-52)
useEffect(() => {
  if (company) {
    setFormData({
      name: company.name,
      contact_email: company.contact_email,
      status: company.status, // ✅ Value is set
    });
    // ❌ MISSING: Clear validation errors
  }
}, [company]);
```

**Issue**: While `formData.status` gets the value, if there's a validation error in `errors.status`, it won't clear automatically.

### Expected Behavior
Status dropdown should show the saved company status (e.g., "Active", "Trial", "Suspended", "Test")

### Actual Behavior
Status dropdown appears empty/unselected

### Fix Required
Apply the **Story 7.4 auto-population pattern**:

```typescript
useEffect(() => {
  if (company) {
    setFormData({
      name: company.name,
      contact_email: company.contact_email,
      status: company.status,
    });

    // Clear any validation errors when loading existing data
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.status;
      return newErrors;
    });
  }
}, [company]);
```

### Priority
🔴 **High** - Blocks SAT-2.1 test case, affects user ability to edit companies

### Related Documentation
- `docs/lessons-learned/auto-selection-validation-error-bug.md` - Same pattern from Story 7.4

---

## Bug 2: "Company Not Found" Errors After Deletion

### Location
Multiple pages that reference deleted companies

### Description
After successfully deleting a test company, if user refreshes pages that were open for that company, they get uncaught ConvexErrors instead of graceful error handling.

**Affected Pages**:
- `/admin/companies/[id]/edit` - Edit page
- `/admin/companies/[id]/users` - Users page
- `/admin/companies/[id]/sites` - Sites page
- `/admin/companies/[id]/participants` - Participants page

### Errors Observed

#### Edit Page Error:
```
ConvexError: [CONVEX Q(companies/admin:getCompanyForEdit)] Server Error
Uncaught ConvexError: Company not found
    at handler (../../companies/admin.ts:36:11)
```

#### Users/Sites/Participants Error:
```
ConvexError: [CONVEX Q(companies/getCompanyDetails:default)] Server Error
Uncaught ConvexError: Company not found
    at handler (../../companies/getCompanyDetails.ts:43:11)
```

### Root Cause
Pages don't handle the case where a company is deleted while the page is still open in browser tabs.

**Scenario**:
1. System admin opens multiple tabs for a company (edit, users, sites, participants)
2. System admin deletes the company from listing page
3. Deletion succeeds, redirect to listing works
4. User switches to one of the other open tabs
5. User refreshes the page
6. Query executes for deleted company
7. Backend throws "Company not found" error
8. Frontend doesn't catch it → Runtime error crashes page

### Expected Behavior
Pages should detect deleted companies and show user-friendly message:
- "Company Not Found"
- "This company may have been deleted"
- Button to return to company listing

### Actual Behavior
Uncaught ConvexError crashes the page with red error overlay

### Fix Required

**Pattern 1**: Check if query returns null/error:
```typescript
const company = useQuery(/* ... */);

if (company === undefined) {
  return <LoadingState />;
}

if (company === null) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Not Found</CardTitle>
        <CardDescription>
          This company may have been deleted or you may not have access to it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/admin/companies">
          <Button>Return to Company Listing</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Continue with normal rendering
```

**Pattern 2**: Update backend to return null instead of throwing:
```typescript
// Current (throws error)
if (!company) {
  throw new ConvexError('Company not found');
}

// Better (returns null)
if (!company) {
  return null;
}
```

### Priority
🟡 **Medium** - Edge case, but affects user experience after deletion. May confuse users.

### Pages to Fix
1. `apps/web/app/admin/companies/[id]/edit/page.tsx`
2. `apps/web/app/admin/companies/[id]/users/page.tsx`
3. `apps/web/app/admin/companies/[id]/sites/page.tsx`
4. `apps/web/app/admin/companies/[id]/participants/page.tsx`

### Related Issues
This is similar to the unauthorized access errors but for deleted resources instead of permission issues.

---

## Bug 3: Inconsistent Error Messaging (Already Documented)

### Summary
Already captured in `error-messaging-audit-2025-10-13.md`

**Quick Reference**:
- Grey vs Red alerts
- Inconsistent message formats
- Uncaught ConvexErrors on unauthorized access

---

## Testing Impact

### SAT Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| SAT-2.1: Company Edit Form Display | ❌ **FAILED** | Status field not populated |
| SAT-2.2: Company Edit Validation | ⚠️ **PARTIAL** | Only status field issue |
| SAT-4.4: Cleanup Execution | ⚠️ **PARTIAL** | Deletion works but leaves open tabs broken |

### Blocked Tests
- Cannot complete SAT-2.1 until Bug 1 fixed
- SAT-4.4 reveals Bug 2 (edge case)

---

## Recommended Fixes Priority

### Immediate (Block SAT completion)
1. **Bug 1**: Status field auto-population
   - **Time**: ~15 minutes
   - **Risk**: Low (known pattern from Story 7.4)
   - **Impact**: Unblocks SAT testing

### Soon (Complete error handling)
2. **Bug 2**: Company not found handling
   - **Time**: ~1 hour (4 pages)
   - **Risk**: Low
   - **Impact**: Better UX for edge cases

3. **Bug 3**: Error messaging consistency
   - **Time**: ~2-3 hours (already documented)
   - **Risk**: Low
   - **Impact**: Professional, consistent UX

---

## Fix Checklist

### Bug 1: Status Auto-Population
- [ ] Read Story 7.4 fix pattern
- [ ] Update useEffect to clear validation errors
- [ ] Test: Edit page loads with status selected
- [ ] Test: Can change status and save
- [ ] Test: Validation still works on invalid changes

### Bug 2: Deleted Company Handling
For each page (edit, users, sites, participants):
- [ ] Add null check after query
- [ ] Return "Not Found" card component
- [ ] Provide navigation back to listing
- [ ] Test: Deleted company shows friendly message
- [ ] Test: No runtime errors in console

### Bug 3: Error Messaging
- [ ] Use audit document
- [ ] Follow phased implementation plan
- [ ] Create UnauthorizedAccessCard instances
- [ ] Test all role combinations

---

## Lessons Learned

1. **Test deletion edge cases** - Open tabs to deleted resources
2. **Apply learned patterns consistently** - Story 7.4 fix should have been applied to Story 7.5
3. **Check all CRUD operations** - Create, Read, Update, AND Delete edge cases
4. **Test with real workflows** - Users DO keep multiple tabs open

---

## Related Documentation

- `docs/lessons-learned/auto-selection-validation-error-bug.md` - Story 7.4 pattern
- `docs/lessons-learned/error-messaging-audit-2025-10-13.md` - Error consistency audit
- `docs/patterns/error-messaging-consistency.md` - Standard patterns
- `docs/testing/stories/story-acceptance-test-7.5.md` - SAT document

---

## Next Actions

1. **Fix Bug 1** immediately to unblock SAT
2. **Document fix** in this file when complete
3. **Re-run SAT-2.1** to verify
4. **Schedule Bug 2 fix** for next available time
5. **Schedule Bug 3 fix** as separate story or sprint task
