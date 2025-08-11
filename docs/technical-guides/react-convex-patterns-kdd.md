# React + Convex Development Patterns KDD

**Knowledge-Driven Development Document**  
**Created**: 2025-08-11  
**Context**: Lessons learned from resolving infinite useEffect recursion in ClarificationStep component

## Executive Summary

This KDD captures critical lessons learned from a complex debugging session where we overcomplicated a simple user interaction flow, leading to infinite useEffect loops and browser crashes. The root cause was fighting against React + Convex's natural patterns instead of embracing them.

## The Problem We Solved

### Initial Symptoms
- Browser crashes due to infinite useEffect recursion
- Console logs showing 8+ repeated useEffect calls
- Complex recursion protection code that didn't solve the root issue
- Over-engineered state management for simple user interactions

### Root Cause Analysis
1. **Anti-Pattern**: Automatic `useAction` triggers in `useEffect` (against Convex best practices)
2. **Dependency Loop**: `generationError` state in useEffect dependencies causing re-render cycles
3. **Fighting Framework**: Complex protection instead of using proper patterns
4. **Overengineering**: Error boundaries and state management for simple flows

## The Correct Patterns

### ✅ **Pattern 1: User-Driven Action Flow**

**Simple Reality**: Form → Button Click → Server Action → Reactive UI Update

```typescript
// ❌ WRONG: Automatic useEffect triggers
useEffect(() => {
  if (conditions) {
    generateQuestions(...); // Anti-pattern!
  }
}, [deps]);

// ✅ CORRECT: Manual user-triggered actions
const handleGenerateQuestions = useCallback(async () => {
  const result = await generateQuestions({...});
  // Let useQuery handle UI updates reactively
}, [deps]);

return (
  <Button onClick={handleGenerateQuestions}>
    Generate Questions
  </Button>
);
```

**Key Principle**: Users drive actions, not automatic effects.

### ✅ **Pattern 2: Trust Convex Reactivity**

**Convex Strength**: Automatic UI updates when database changes

```typescript
// ✅ CORRECT: Query for existing data
const existingQuestions = useQuery(api.getClarificationQuestions, 
  sessionToken ? { sessionToken, incident_id, phase } : "skip"
);

// ✅ CORRECT: Trigger server-side action
const generateQuestions = useAction(api.generateClarificationQuestions);

// ✅ CORRECT: Let Convex update UI automatically
// No manual state setting needed - useQuery will update when data changes
```

**Key Principle**: Server changes database → useQuery automatically updates UI.

### ✅ **Pattern 3: Minimal State Management**

**Keep It Simple**: Only manage UI-specific state, let Convex handle data

```typescript
// ✅ CORRECT: Minimal local state
const [isGenerating, setIsGenerating] = useState(false);
const [generationError, setGenerationError] = useState<string | null>(null);

// ❌ WRONG: Complex protection state
const [recursionCount, setRecursionCount] = useState(0);
const [lastAttempt, setLastAttempt] = useState<string | null>(null);
const [errorBoundaryState, setErrorBoundaryState] = useState({...});
```

**Key Principle**: If Convex can manage it, don't duplicate it in local state.

### ✅ **Pattern 4: Stable useEffect Dependencies**

**Root Cause of Loops**: State variables that update within the effect

```typescript
// ❌ WRONG: State that updates in effect as dependency
useEffect(() => {
  if (error) return; // This creates a loop when setError is called
  // ... logic that calls setError(...)
}, [error, otherDeps]); // error causes re-renders

// ✅ CORRECT: Only external data dependencies
useEffect(() => {
  if (existingQuestions) {
    setQuestions(existingQuestions);
  }
}, [existingQuestions]); // Only data from Convex, no internal state
```

**Key Principle**: Never include state variables in dependencies if the effect updates them.

### ✅ **Pattern 5: Proper Error Handling**

**Simple Standard Patterns**: No complex error boundaries for basic errors

```typescript
// ❌ WRONG: Complex error boundaries for simple errors
<ErrorBoundary onError={handleComplexRecovery}>
  <Component />
</ErrorBoundary>

// ✅ CORRECT: Standard try-catch with user feedback
try {
  await action();
} catch (error) {
  setError(error.message);
  // Show user-friendly error message
}
```

**Key Principle**: Error boundaries for crashes, try-catch for expected errors.

## Convex-Specific Best Practices

### 1. **Action vs Mutation Decision Tree**

```
User wants to trigger AI/external service?
├── Yes → Use useAction (server-side processing)
├── No → Direct database change?
    ├── Yes → Use useMutation (immediate DB update)
    └── No → Use useQuery (read-only data)
```

### 2. **Conditional Query Pattern**

```typescript
// ✅ CORRECT: Use "skip" for conditional queries
const data = useQuery(api.getData, 
  sessionToken ? { sessionToken, id } : "skip"
);
```

### 3. **Action Patterns**

```typescript
// ✅ CORRECT: Actions handle complex server-side logic
export const generateQuestions = action({
  handler: async (ctx, args) => {
    // 1. Auth verification
    // 2. External API calls (LLM, etc.)
    // 3. Database storage via mutations
    // 4. Return result (UI updates via useQuery)
  }
});
```

## Anti-Patterns to Avoid

### ❌ **Anti-Pattern 1: useEffect + useAction**

```typescript
// ❌ NEVER DO THIS
useEffect(() => {
  if (shouldGenerate) {
    generateAction(...); // Creates recursion risk
  }
}, [shouldGenerate, generateAction]);
```

**Why Wrong**: Actions should be user-triggered, not automatic.

### ❌ **Anti-Pattern 2: State in Effect Dependencies**

```typescript
// ❌ CREATES LOOPS
const [error, setError] = useState(null);
useEffect(() => {
  if (condition && !error) {
    setError('something'); // Causes re-render → infinite loop
  }
}, [condition, error]); // error dependency is the problem
```

### ❌ **Anti-Pattern 3: Complex State Duplication**

```typescript
// ❌ DON'T DUPLICATE CONVEX DATA
const [questions, setQuestions] = useState([]);
const [questionStatus, setQuestionStatus] = useState({});
const [questionMeta, setQuestionMeta] = useState({});

// ✅ TRUST CONVEX QUERIES
const questions = useQuery(api.getQuestions, {...});
```

### ❌ **Anti-Pattern 4: Over-Protection**

```typescript
// ❌ FIGHTING SYMPTOMS, NOT CAUSE
const recursionRef = useRef(0);
const protectionRef = useRef(false);
const attemptTracking = useRef({});

// ✅ FIX THE ROOT CAUSE
// Proper dependencies and user-driven actions
```

## Implementation Checklist

### Before Writing Components
- [ ] **Identify user actions** - What should trigger data changes?
- [ ] **Choose Convex hooks correctly** - Query for reads, Action for complex logic, Mutation for direct DB
- [ ] **Plan state minimally** - What can't Convex handle?

### During Development
- [ ] **No automatic actions** - Actions only in event handlers
- [ ] **Stable dependencies** - No state variables that the effect updates
- [ ] **Trust reactivity** - Let useQuery handle UI updates
- [ ] **Simple error handling** - Try-catch for expected errors

### Code Review Questions
- [ ] Are there any `useAction` calls inside `useEffect`?
- [ ] Do useEffect dependencies include state variables that the effect updates?
- [ ] Is the component trying to manage data that Convex should handle?
- [ ] Are user interactions properly separated from automatic effects?

## Testing Strategy

### Test the Flow, Not the Implementation
```typescript
// ✅ TEST USER FLOW
1. User navigates to step → UI shows correct state
2. User clicks button → Loading state appears
3. Server completes → Questions appear automatically
4. User types answer → Auto-save works
5. User navigates → State persists

// ❌ DON'T TEST IMPLEMENTATION DETAILS
- useEffect call counts
- Internal state transitions  
- Recursion protection logic
```

## Recovery Patterns

### When You Hit Recursion Issues
1. **Stop adding protection** - Fix the root cause
2. **Check useEffect dependencies** - Remove state variables updated in the effect
3. **Move to user-driven actions** - Remove automatic triggers
4. **Simplify state management** - Trust Convex reactivity

### Warning Signs
- useEffect running more than once unexpectedly
- Need for recursion protection or counters
- Complex error boundaries for simple errors
- Duplicating data that Convex manages
- Fighting framework patterns with workarounds

## Conclusion

**The Golden Rule**: Work WITH React and Convex patterns, not against them.

- **React**: User interactions drive state changes
- **Convex**: Server handles complex logic, client reacts to data changes  
- **Simplicity**: Minimal state, clear separation of concerns

When in doubt, ask: "Am I fighting the framework or working with it?"

## References

- [Convex React Best Practices](https://docs.convex.dev/client/react)
- [React 18 useEffect Guide](https://react.dev/reference/react/useEffect)
- **Source**: ClarificationStep.tsx refactor (2025-08-11)
- **Related**: Epic 3 Story 3.2 implementation lessons