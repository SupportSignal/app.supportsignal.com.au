# Bug: Premature Validation Error on Auto-Selected Form Fields

**Discovered**: October 11, 2025 (Story 7.4)
**Severity**: Medium - UX Issue
**Affected Component**: `apps/web/app/admin/companies/[id]/participants/create/page.tsx`
**Fixed In**: Story 7.4 implementation
**Related Story**: Story 7.4 - Initial Participant Setup

## The Bug

When a form field is **auto-populated** by React useEffect (e.g., auto-selecting a site when company has only one site), the validation error message appears prematurely even though the field has a valid value.

### Visual Evidence

User screenshot showed:
- Site dropdown showing "Primary" (correctly auto-selected)
- Red error message: "Please select a site" (incorrectly showing)
- Form unable to submit despite having valid data

### Broken Code Pattern

```typescript
// ❌ BUG: Auto-selection sets form data but doesn't clear validation errors
useEffect(() => {
  if (sites && sites.length === 1 && !formData.siteId) {
    setFormData(prev => ({ ...prev, siteId: sites[0]._id }));
    // Missing: validation error cleanup!
  }
}, [sites, formData.siteId]);
```

### Root Cause

**Sequence of events:**
1. Form renders with empty `siteId` field
2. User might click on field or trigger validation somehow
3. Validation error sets: `errors.siteId = "Please select a site"`
4. Sites query completes, useEffect auto-selects site
5. `formData.siteId` is now populated (valid!)
6. **But**: `errors.siteId` still contains old error message
7. User sees error even though field has value

**Why it happens:**
- Auto-population updates form state (`formData`)
- But does NOT clear validation state (`errors`)
- These are separate state objects that don't sync automatically

## The Fix

### Corrected Code Pattern

```typescript
// ✅ FIXED: Auto-selection clears validation errors
useEffect(() => {
  if (sites && sites.length === 1 && !formData.siteId) {
    setFormData(prev => ({ ...prev, siteId: sites[0]._id }));

    // Clear any existing site validation error when auto-selecting
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.siteId;
      return newErrors;
    });
  }
}, [sites, formData.siteId]);
```

### Fix Components

1. **Form data update** - Set the auto-selected value
2. **Error cleanup** - Remove validation error for that field
3. **Immutable pattern** - Create new errors object, don't mutate

## Prevention Pattern

### Template for Auto-Population with Validation

```typescript
// Any time you auto-populate a form field, also clear its validation error
useEffect(() => {
  if (shouldAutoPopulate) {
    // 1. Update form data
    setFormData(prev => ({
      ...prev,
      fieldName: autoSelectedValue
    }));

    // 2. Clear validation error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.fieldName;
      return newErrors;
    });
  }
}, [dependencies]);
```

### When to Apply This Pattern

Apply validation error clearing when:
- ✅ Auto-selecting dropdown values based on query results
- ✅ Pre-filling fields from URL parameters
- ✅ Loading saved draft data into forms
- ✅ Copying data from related entities
- ✅ Any programmatic form population after initial render

### When NOT to Apply

Don't clear errors when:
- ❌ User manually changes field value (use onBlur validation instead)
- ❌ Form is submitting (validation should run fresh)
- ❌ Initial form state setup (no errors exist yet)

## Related Patterns

### Multi-Field Auto-Population

```typescript
useEffect(() => {
  if (shouldAutoPopulate) {
    // Update multiple fields at once
    setFormData(prev => ({
      ...prev,
      field1: value1,
      field2: value2,
      field3: value3,
    }));

    // Clear errors for all auto-populated fields
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.field1;
      delete newErrors.field2;
      delete newErrors.field3;
      return newErrors;
    });
  }
}, [dependencies]);
```

### Conditional Auto-Population

```typescript
useEffect(() => {
  if (options && options.length === 1) {
    // Auto-select only option
    setFormData(prev => ({ ...prev, selection: options[0].id }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.selection;
      return newErrors;
    });
  } else if (options && options.length === 0) {
    // Clear selection if no options available
    setFormData(prev => ({ ...prev, selection: '' }));
    // Keep error if field is required - user needs to see "No options available"
  }
}, [options]);
```

## Testing Checklist

When implementing auto-population, test:

- [ ] Field auto-populates correctly when condition is met
- [ ] No validation error appears when field auto-populates
- [ ] Error appears if user manually clears auto-populated value
- [ ] Error appears if auto-population condition fails
- [ ] Error clears when user manually fixes the field
- [ ] Form submits successfully with auto-populated value
- [ ] Auto-population doesn't run repeatedly (check dependencies)

## Real-World Example

**Story 7.4 Context:**
- Creating participant requires selecting a site
- If company has only 1 site, auto-select it (better UX)
- User reported seeing "Please select a site" error on auto-selected dropdown
- Fix: Added validation error cleanup to auto-selection logic

**Impact:**
- Bug blocked user from creating participants
- Appeared as if site selection wasn't working
- Confused user about form state
- Quick fix improved UX significantly

## Key Takeaways

1. **Auto-population is NOT just data update** - Must also manage validation state
2. **Form state and error state are separate** - They don't sync automatically
3. **Always clear errors when auto-populating** - Otherwise old errors persist
4. **Use immutable updates** - Create new error object, don't mutate existing
5. **Test the UX flow** - Don't just test that data populates, test error states too

## Related Documentation

- [Form Validation Patterns](../patterns/form-validation-patterns.md)
- [React State Management Best Practices](../patterns/react-state-management.md)
- Story 7.4: Initial Participant Setup (where bug was discovered and fixed)

## Action Items

- [x] Fix auto-selection in Story 7.4 participant creation form
- [x] Document pattern for future reference
- [ ] Review other forms for similar auto-population without error clearing
- [ ] Consider creating reusable hook: `useAutoPopulateField()`
- [ ] Add to code review checklist: "Auto-population clears validation errors?"
