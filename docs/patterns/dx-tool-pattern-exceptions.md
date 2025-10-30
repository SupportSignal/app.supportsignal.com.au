# DX Tool Pattern Exceptions

**Pattern Category**: Developer Experience (DX)
**Status**: Established
**Last Updated**: 2025-10-29
**Source**: Story 0.8 - Loading State Pattern Implementation

---

## Overview

Developer Experience (DX) tools may intentionally deviate from production patterns to prioritize developer convenience and efficiency over strict safety guarantees. This document establishes when and how to apply pattern exceptions for DX tools.

## When to Apply DX Exceptions

### Criteria for DX Tools

A feature qualifies as a "DX tool" if it meets these criteria:

1. **Primary Users**: Developers, not end users
2. **Environment**: Development/testing environment only
3. **Purpose**: Facilitate testing, debugging, or rapid iteration
4. **Risk Tolerance**: Developers understand and can handle edge cases

### Examples of DX Tools

**Qualifying DX Tools**:
- "Regenerate Questions" button - allows developers to test multiple question generation cycles
- "Fill Q&A" with test data - populates forms quickly for testing
- Debug panels and inspection tools
- Data seeding and reset operations

**NOT DX Tools** (use production patterns):
- User-facing form submissions
- Production data mutations
- End-user workflows
- Critical business operations

## Pattern Exception: Loading States

### Production Pattern (Strict)

**Rule**: Any mutation that changes database → Page-Level Loader (blocks navigation)

**Why**: Prevents state management complexity, ensures data consistency

**Visual**: Black overlay (`bg-black/20`), z-index 50, completely blocks UI

### DX Exception Pattern

**Rule**: DX tools MAY use Card-Level Loader for mutations if:
- Developers need to test multiple iterations efficiently
- Non-blocking UX reduces development friction
- Developers understand race condition risks
- Visual distinction signals "this is a DX tool"

**Visual**: White overlay (`bg-white/80`), z-index 10, non-blocking

### Implementation Example

```typescript
// DX Tool: "Regenerate Questions" button
const handleRegenerateQuestions = async () => {
  setIsRegenerating(true); // Card-Level loader
  try {
    await regenerateQuestions(phaseId);
  } finally {
    setIsRegenerating(false);
  }
};

// Loader JSX (Card-Level - non-blocking)
{isRegenerating && (
  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-sm text-gray-600">Regenerating questions...</p>
    </div>
  </div>
)}
```

**Visual Distinction**:
- White overlay (vs black for production)
- Lower z-index (10 vs 50)
- Positioned absolutely (vs fixed)
- Navigation still possible

## Documentation Requirements

When implementing DX pattern exceptions, MUST document:

1. **Which tool uses the exception** - specific feature name
2. **Why the exception is justified** - developer convenience vs strict safety
3. **Visual distinction** - how users identify it as a DX tool
4. **Risk acknowledgment** - developers understand potential edge cases

### Example Documentation

```markdown
**DX Tool Exception (Intentional Design Decision)**:
- **"Regenerate Questions"** button uses Card-Level loader (white overlay)
- **Why**: Developer Experience tools prioritize convenience over strict safety patterns
- **Justification**:
  - Developers need to test multiple phases without blocking UX
  - Non-blocking allows regenerating multiple phases efficiently
  - Visual distinction (white vs black overlay) signals "this is a DX tool"
  - Developers understand race conditions and can handle complexity
```

## Decision Matrix

| Aspect | Production Pattern | DX Tool Exception |
|--------|-------------------|-------------------|
| **User Type** | End users | Developers |
| **Environment** | Production | Development/testing |
| **Pattern Rule** | Mutation → Page-Level | May use Card-Level for convenience |
| **Blocking** | Completely blocks UI | Non-blocking (white overlay) |
| **Risk** | Zero tolerance for race conditions | Developers can handle edge cases |
| **Visual** | Black overlay, z-50 | White overlay, z-10 |
| **Navigation** | Completely prevented | Still allowed |

## Anti-Patterns

**❌ DON'T**:
- Apply DX exceptions to end-user features
- Use DX exceptions in production environment
- Skip documentation of exceptions
- Hide the visual distinction

**✅ DO**:
- Limit exceptions to true development tools
- Maintain clear visual distinction
- Document all exceptions with justification
- Consider developer efficiency vs safety trade-offs

## Testing Considerations

### UAT Testing
- DX tools should be tested separately from production features
- Document exceptions clearly in acceptance criteria
- Verify visual distinction is maintained

### Production Deployment
- Ensure DX tools are feature-flagged or disabled in production
- Never expose DX pattern exceptions to end users

## Related Patterns

- [Loading State Patterns](./loading-states.md) - Base pattern for all loading states
- [Mutation Safety Patterns](./mutation-safety-patterns.md) - Production mutation handling

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-29 | 1.0 | Initial pattern documentation from Story 0.8 learnings | James (Dev Agent) |
