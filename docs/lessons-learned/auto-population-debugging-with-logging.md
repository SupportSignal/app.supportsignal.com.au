# Auto-Population Debugging with Comprehensive Logging

## Lesson Summary
When auto-population features don't work as expected, **comprehensive console logging at every step** is the fastest path to diagnosis. Add logging for: data input, transformation logic, and final state updates.

## Context: Story 7.6 SAT Testing

### The Problem
During Story Acceptance Testing (UAT-7.6.2), site auto-population from participant wasn't working. User reported selecting a participant but the site dropdown remained empty.

### Initial Response
Instead of making assumptions, we added **comprehensive logging** at every stage of the auto-population flow:

```typescript
// 1. Log when participant is selected
const handleParticipantSelect = (participant: Participant | null) => {
  console.log('🔍 PARTICIPANT SELECTION EVENT', {
    hasParticipant: !!participant,
    participant: participant ? {
      id: participant._id,
      name: `${participant.first_name} ${participant.last_name}`,
      site_id: participant.site_id,
      hasSiteId: !!participant.site_id,
    } : null,
    currentFormSiteId: formData.site_id,
  });

  // 2. Log before updating form data
  const newSiteId = participant.site_id || formData.site_id;
  console.log('🔄 UPDATING FORM DATA', {
    previousSiteId: formData.site_id,
    participantSiteId: participant.site_id,
    newSiteId: newSiteId,
    willAutoPopulate: !!participant.site_id,
  });

  setFormData(updatedFormData);

  // 3. Log after form data updated
  console.log('✅ FORM DATA UPDATED', {
    newFormData: updatedFormData,
    siteIdSet: updatedFormData.site_id,
  });
};

// 4. Log when site field changes via useEffect
useEffect(() => {
  console.log('📊 FORMDATA SITE_ID CHANGED', {
    currentSiteId: formData.site_id,
    timestamp: new Date().toISOString(),
  });
}, [formData.site_id]);
```

### The Diagnosis
The logging immediately revealed the root cause:

```
🔍 PARTICIPANT SELECTION EVENT {hasParticipant: true, participant: {site_id: undefined}}
🔄 UPDATING FORM DATA {participantSiteId: undefined, newSiteId: undefined}
⚠️ NO AUTO-POPULATION - Participant has no site_id
```

**Clear finding**: `participant.site_id` was `undefined` - the backend wasn't returning it!

### The Fix
Backend query was missing `site_id` in the response mapping:
```typescript
// apps/convex/participants/list.ts
return {
  participants: participants.map(p => ({
    // ... other fields ...
    site_id: p.site_id, // ✅ Added this line
  })),
};
```

## Key Takeaways

### 1. Log Early, Log Often
Don't wait for issues to arise - **add logging proactively** during implementation:
- Log inputs to functions
- Log intermediate transformations
- Log final state updates
- Log useEffect triggers

### 2. Structured Logging Format
Use consistent emoji prefixes and structured objects:
```typescript
console.log('🔍 PARTICIPANT SELECTION EVENT', {
  // Structured data here
});
```

Benefits:
- Easy to filter in console (search for emoji)
- Consistent across the codebase
- Easy to read and understand

### 3. Logging Categories by Phase
```
🔍 Initial event/trigger
🔄 Processing/transformation
✅ Successful completion
⚠️ Warning conditions
🏢 Business logic execution
📊 State monitoring
```

### 4. Defensive Logging
Log both success and failure paths:
```typescript
if (participant.site_id) {
  console.log('🏢 AUTO-POPULATED SITE', {...});
} else {
  console.log('⚠️ NO AUTO-POPULATION - Participant has no site_id');
}
```

### 5. Remove or Reduce After Diagnosis
Once the issue is found and fixed:
- Keep minimal logging for future debugging
- Remove verbose intermediate logs
- Document the pattern in knowledge base

## Logging Best Practices

### DO:
✅ Log structured objects, not strings
✅ Include timestamps for sequential issues
✅ Log both happy and error paths
✅ Use consistent emoji/prefix conventions
✅ Keep logging during development and testing

### DON'T:
❌ Log sensitive data (passwords, tokens, PII)
❌ Log in tight loops (performance impact)
❌ Rely solely on debugger breakpoints (logging persists across sessions)
❌ Remove all logging after fixing (keep minimal for future debugging)

## Example Template

```typescript
const handleComplexOperation = (input: ComplexInput) => {
  // 1. Log input
  console.log('🔍 OPERATION START', {
    input: sanitize(input), // Remove sensitive data
    timestamp: new Date().toISOString(),
  });

  // 2. Log transformation
  const transformed = transform(input);
  console.log('🔄 TRANSFORMATION COMPLETE', {
    before: input.key,
    after: transformed.key,
    changed: input.key !== transformed.key,
  });

  // 3. Log final state
  setFormData(transformed);
  console.log('✅ STATE UPDATED', {
    newState: transformed,
    success: true,
  });
};
```

## Time Savings
**Diagnosis time with logging**: 2 minutes (see undefined, check backend query, fix)

**Diagnosis time without logging**: 30+ minutes (guess, test, repeat)

**ROI**: ~15x faster debugging

## Related Patterns
- [Backend Query Completeness](../patterns/backend-query-completeness.md)
- [Smart Auto-Population Pattern](../patterns/smart-auto-population-pattern.md)

## References
- Story 7.6: Incident Capture Site Selection
- SAT Test: UAT-7.6.2 (Site auto-populates from participant)
- File: `apps/web/components/incidents/incident-metadata-form.tsx:280-340`

---
**Created**: October 23, 2025
**Lesson Source**: Story 7.6 SAT Testing
**Impact**: High (debugging pattern applies across all auto-population features)
