# Logging Strategy for User-Facing Features

**Context**: Story 6.5 - Debugging Fill Q&A button with no visible feedback

## Problem Statement

User clicked "Fill Q&A" button and waited 1 minute before seeing any error message. No logs indicated:
- Whether button was clicked
- What function was called
- What parameters were passed
- Where the failure occurred

**User experience**: Complete silence → long wait → cryptic error.

## Anti-Pattern: Sparse Logging

**Bad example** (before fix):
```typescript
const handleFillQA = async () => {
  if (!user?.sessionToken || !incidentId) {
    console.warn('Cannot fill Q&A: missing session token or incident ID');
    return;
  }

  try {
    const currentPhase = getCurrentPhase();
    const result = await generateMockAnswers({
      sessionToken: user.sessionToken,
      incident_id: incidentId,
      phase: currentPhase
    });

    if (result.success) {
      console.log('✅ Mock answers generated');
    } else {
      console.error('❌ Failed to generate mock answers:', result);
    }
  } catch (error) {
    console.error('❌ Error generating mock answers:', error);
  }
};
```

**Problems**:
- No log when button is clicked (can't confirm handler executed)
- No log before API call (can't confirm we got that far)
- No log showing what was passed (can't verify parameters)
- Only logs success/failure (too late for debugging)

## Pattern: Comprehensive Entry-Point Logging

**Good example** (after fix):
```typescript
const handleFillQA = async () => {
  // 1. IMMEDIATE LOG - Proves button click executed handler
  console.log('🔴 FILL Q&A BUTTON CLICKED', {
    timestamp: new Date().toISOString(),
    hasUser: !!user,
    hasSessionToken: !!user?.sessionToken,
    incidentId,
    currentStep
  });

  // 2. EARLY VALIDATION LOG - Shows why we might exit early
  if (!user?.sessionToken || !incidentId) {
    console.warn('❌ Cannot fill Q&A: missing session token or incident ID', {
      hasUser: !!user,
      hasSessionToken: !!user?.sessionToken,
      incidentId
    });
    return;
  }

  // 3. NAVIGATION LOG - Shows state changes
  if (currentStep < 2 || currentStep > 5) {
    console.log('⚠️ Navigating to first Q&A step (was on step:', currentStep, ')');
    setCurrentStep(2);
  }

  try {
    const currentPhase = getCurrentPhase();

    // 4. PRE-API LOG - Proves we reached the API call
    console.log('🚀 Calling generateMockAnswers', {
      phase: currentPhase,
      incidentId,
      hasSessionToken: !!user.sessionToken
    });

    const result = await generateMockAnswers({
      sessionToken: user.sessionToken,
      incident_id: incidentId,
      phase: currentPhase
    });

    // 5. POST-API LOG - Shows what came back
    console.log('📥 generateMockAnswers returned:', result);

    // 6. OUTCOME LOGS - Shows which branch executed
    if (result.success) {
      console.log('✅ Mock answers generated for phase:', currentPhase, result);
    } else {
      console.error('❌ Failed to generate mock answers:', result);
    }
  } catch (error) {
    console.error('❌ Error generating mock answers:', error);
  }
};
```

## Logging Levels by Execution Stage

### Stage 1: Entry Point (IMMEDIATE)

**Purpose**: Prove the handler executed
**Timing**: Within 1ms of user action
**Content**: User context and input parameters

```typescript
console.log('🔴 BUTTON CLICKED', {
  timestamp: new Date().toISOString(),
  hasUser: !!user,
  incidentId,
  currentStep
});
```

### Stage 2: Validation (EARLY)

**Purpose**: Show why early exits happen
**Timing**: Before any business logic
**Content**: Validation failures and missing data

```typescript
if (!required) {
  console.warn('❌ Validation failed:', {
    hasRequired: !!required,
    reason: 'missing_data'
  });
  return;
}
```

### Stage 3: State Changes

**Purpose**: Track side effects and navigation
**Timing**: Before mutations
**Content**: Old state → new state

```typescript
console.log('⚠️ State change:', {
  from: currentStep,
  to: newStep,
  reason: 'validation_correction'
});
```

### Stage 4: External Calls (PRE)

**Purpose**: Prove we reached the external call
**Timing**: Immediately before API/action/mutation
**Content**: Parameters being sent

```typescript
console.log('🚀 Calling external API', {
  endpoint: 'generateMockAnswers',
  params: { phase, incidentId }
});
```

### Stage 5: External Calls (POST)

**Purpose**: Show what came back
**Timing**: Immediately after API/action/mutation
**Content**: Response structure and status

```typescript
console.log('📥 API returned:', {
  hasResult: !!result,
  status: result?.status,
  dataKeys: result ? Object.keys(result) : []
});
```

### Stage 6: Outcomes

**Purpose**: Confirm which branch executed
**Timing**: After branching logic
**Content**: Success/failure with details

```typescript
if (result.success) {
  console.log('✅ Success:', result);
} else {
  console.error('❌ Failure:', result);
}
```

## Emoji Convention for Quick Scanning

| Emoji | Meaning | Use Case |
|-------|---------|----------|
| 🔴 | Entry point | User action triggered |
| 🚀 | Starting operation | About to call API/function |
| 📥 | Received response | API/function returned |
| ✅ | Success | Operation completed successfully |
| ❌ | Failure | Operation failed |
| ⚠️ | Warning | Non-critical issue or state change |
| 🔍 | Debug detail | Deep inspection of data |
| 🐛 | Bug trace | Debugging-specific log |

**Benefit**: Logs are scannable at a glance in busy console output.

## Structured Log Objects

**Always use objects for context**:

```typescript
// ❌ Bad - Hard to parse, loses structure
console.log('User clicked button', user, incidentId, currentStep);

// ✅ Good - Structured, labeled, scannable
console.log('🔴 BUTTON CLICKED', {
  hasUser: !!user,
  userId: user?._id,
  incidentId,
  currentStep
});
```

**Benefits**:
- Easy to read in console
- Can be parsed by log aggregators
- Clear key-value relationships
- Type-safe with TypeScript

## Defensive Logging

**Never assume external data structure**:

```typescript
// ❌ Dangerous - Might crash if result is malformed
console.log('Result:', result.data.users[0].name);

// ✅ Safe - Shows structure without assumptions
console.log('📥 API returned:', {
  hasResult: !!result,
  hasData: !!(result?.data),
  dataKeys: result?.data ? Object.keys(result.data) : [],
  resultPreview: JSON.stringify(result, null, 2).substring(0, 500)
});
```

## Logging Checklist for User-Facing Features

When implementing any user-triggered action:

- [ ] **Entry log**: User clicked/triggered (immediate, <1ms)
- [ ] **Validation logs**: Show why early exits happen
- [ ] **Pre-call logs**: About to execute external operation
- [ ] **Post-call logs**: External operation returned
- [ ] **Success/failure logs**: Which outcome branch executed
- [ ] **Error logs**: Full error context, not just message
- [ ] **Structured objects**: All logs use labeled key-value pairs
- [ ] **Safe access**: No assumptions about data structure

## When to Add Logging

### Always Log

- User-triggered actions (clicks, form submissions)
- External API calls (before and after)
- Error conditions
- State transitions
- Permission checks
- Data mutations

### Consider Logging

- Complex calculations (before and after)
- Loop iterations (summary, not every iteration)
- Conditional branches (which path was taken)
- Data transformations (input and output)

### Don't Log

- Trivial getters/setters
- Pure utility functions (unless debugging)
- Every render cycle
- Sensitive data (passwords, tokens, PII)

## Production vs Development

### Development: Verbose

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Detailed context:', {
    fullState: state,
    computedValues: { /* ... */ },
    intermediateResults: results
  });
}
```

### Production: Structured and Actionable

```typescript
console.log('User action', {
  action: 'fill_qa',
  incidentId,
  phase,
  timestamp: new Date().toISOString(),
  userId: user._id // Non-sensitive identifier only
});
```

## Integration with Error Tracking

**Provide context for error tracking tools**:

```typescript
try {
  await riskyOperation();
} catch (error) {
  // Structured log for Sentry/etc
  console.error('Operation failed', {
    operation: 'fill_qa',
    incidentId,
    phase,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  });

  // Re-throw if needed
  throw error;
}
```

## Lessons Learned from Story 6.5

### Problem: 1-Minute Silent Wait

**User clicked button → no feedback → 1 minute wait → error**

**Root cause**: No immediate logging to confirm button click executed.

**Fix**: Added entry-point log that fires within 1ms of click.

**Result**: User can immediately see:
- Button handler executed
- Parameters passed
- Validation status
- Which API was called
- What came back

### Anti-Pattern: "Only Log Errors"

**Old thinking**: "Logs are for errors, don't clutter console"

**New thinking**: "Logs are for understanding execution flow, especially when things go wrong"

**Evidence**: Most debugging time was spent answering:
- "Did the button click work?"
- "What parameters were passed?"
- "Did we even reach the API call?"

These are NOT error conditions - they're normal execution flow. But without logs, they're invisible.

## Quick Reference

**Minimum logging for any user action**:

```typescript
const handleUserAction = async () => {
  console.log('🔴 ACTION STARTED', { /* context */ });

  try {
    console.log('🚀 Calling API', { /* params */ });
    const result = await apiCall();
    console.log('📥 API returned', { /* result */ });

    if (result.success) {
      console.log('✅ Success');
    } else {
      console.error('❌ Failure', result);
    }
  } catch (error) {
    console.error('❌ Error', error);
  }
};
```

**This simple pattern would have saved hours of debugging in Story 6.5.**
