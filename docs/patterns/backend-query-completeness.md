# Backend Query Completeness Pattern

## Problem Statement
Frontend components fail when backend queries don't include all necessary fields, even if those fields exist in the database schema.

## Pattern Overview
**Always verify backend queries return complete data structures** required by frontend components, especially when implementing new features that reference existing entities.

## Real-World Example: Story 7.6

### The Issue
Site auto-population from participant wasn't working because the backend query didn't include `site_id` in the response.

**Symptom**:
```javascript
// Console log showed:
🔍 PARTICIPANT SELECTION EVENT {participant: {site_id: undefined}}
⚠️ NO AUTO-POPULATION - Participant has no site_id
```

**Root Cause**:
```typescript
// apps/convex/participants/list.ts (BEFORE FIX)
return {
  participants: participants.map(p => ({
    _id: p._id,
    first_name: p.first_name,
    last_name: p.last_name,
    // ... other fields ...
    // ❌ site_id was NOT included
  })),
};
```

### The Fix
```typescript
// apps/convex/participants/list.ts (AFTER FIX)
return {
  participants: participants.map(p => ({
    _id: p._id,
    first_name: p.first_name,
    last_name: p.last_name,
    // ... other fields ...
    site_id: p.site_id, // ✅ Story 7.6: Include site_id for auto-population
  })),
};
```

### Type Safety
Also update TypeScript interfaces to match:
```typescript
// apps/web/types/participants.ts
export interface Participant {
  // ... existing fields ...
  site_id?: Id<"sites">; // ✅ Add to interface
}
```

## Implementation Checklist

When adding new features that reference existing entities:

1. **Verify Schema**: Check database schema for the field you need
2. **Check Backend Query**: Verify the query returns the field in its response mapping
3. **Update TypeScript Types**: Ensure frontend interfaces include the field
4. **Add Logging**: Log the data structure to verify it contains expected fields
5. **Test with Real Data**: Use actual database data, not mocked values

## Anti-Patterns to Avoid

❌ **Assuming fields are included**: Just because a field exists in the schema doesn't mean the query returns it

❌ **Skipping type updates**: Frontend code may compile but fail at runtime without proper types

❌ **Testing with mocks**: Mocked data can hide missing field issues that only surface with real database queries

## Best Practices

✅ **Explicit field mapping**: Map every field explicitly in query responses (don't rely on spread operators blindly)

✅ **Comprehensive logging**: Log the full object structure when debugging auto-population issues

✅ **Type-first development**: Update TypeScript interfaces before implementing frontend logic

✅ **Database verification**: Use Convex CLI to verify actual database records have the expected fields

## Related Patterns
- [Smart Auto-Population Pattern](./smart-auto-population-pattern.md)
- [Form Field Auto-Population](./form-field-auto-population.md)

## References
- Story 7.6: Incident Capture Site Selection
- File: `apps/convex/participants/list.ts:106`
- File: `apps/web/types/participants.ts:25`
- Issue discovered during SAT testing (UAT-7.6.2)

---
**Created**: October 23, 2025
**Last Updated**: October 23, 2025
**Status**: Active Pattern
