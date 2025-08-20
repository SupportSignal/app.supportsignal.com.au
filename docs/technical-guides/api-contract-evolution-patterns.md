# API Contract Evolution Patterns

**Purpose**: Manage frontend-backend interface changes safely without breaking existing functionality.

**Origin**: Lessons learned from dual-model LLM testing implementation (2025-08-20)

## Core Principle

> **Interface changes require explicit backward compatibility strategy and coordinated frontend-backend updates.**

## The Problem

When updating Convex action return types, the frontend continues using the old interface until manually updated. This creates a mismatch where:

- Backend returns new data structure
- Frontend expects old data structure  
- UI displays incomplete or incorrect information
- Developers waste time debugging "missing data" when the issue is interface mismatch

## Solution Framework

### 1. Interface Evolution Strategy

**Additive Changes** (Preferred):
```typescript
// ✅ SAFE - Add new properties while keeping old ones
interface LLMTestResult {
  success: boolean;
  responseTime: number;
  
  // NEW: Enhanced dual-model testing
  testResults?: {
    primary: ModelTestResult;
    fallback: ModelTestResult;
    bothWorking: boolean;
  };
  
  // LEGACY: Keep for backward compatibility
  modelUsed?: string;
  response?: string;
  error?: string;
}
```

**Breaking Changes** (Requires Coordination):
```typescript
// ❌ BREAKING - Removing or renaming existing properties
interface LLMTestResult {
  success: boolean;
  responseTime: number;
  // modelUsed: string;        // REMOVED - breaks existing code
  // response?: string;        // REMOVED - breaks existing code
  
  // NEW: Replacement structure
  testResults: {              // REQUIRED - no fallback
    primary: ModelTestResult;
    fallback: ModelTestResult;
  };
}
```

### 2. Coordinated Update Protocol

**For Additive Changes**:
```
1. Update backend interface (additive only)
2. Update backend implementation  
3. Deploy backend changes
4. Update frontend TypeScript interfaces
5. Update frontend components to use new data
6. Test with real API calls
7. Deploy frontend changes
8. (Optional) Remove legacy properties in future release
```

**For Breaking Changes**:
```
1. Update frontend TypeScript interfaces first
2. Update frontend components with error handling
3. Update backend interface and implementation
4. Deploy both changes simultaneously
5. Test thoroughly with real API calls
```

## Implementation Patterns

### Pattern 1: Gradual Migration (Recommended)

**Backend Implementation**:
```typescript
export const testLLMCommunication = action({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // ... implementation ...
    
    return {
      success: true,
      responseTime: processingTime / 1000,
      
      // NEW: Enhanced format
      testResults: {
        primary: primaryResult,
        fallback: fallbackResult,
        bothWorking: bothSuccessful,
      },
      
      // LEGACY: Maintain compatibility
      modelUsed: primaryResult.model, // For backward compatibility
      response: primaryResult.response, // For backward compatibility
      error: bothSuccessful ? undefined : "Partial or total failure",
      
      // ... other properties
    };
  }
});
```

**Frontend Implementation**:
```typescript
const testResult = await testLLM({});

// NEW: Use enhanced format if available
if (testResult.testResults) {
  displayDualModelResults(testResult.testResults);
} else {
  // LEGACY: Fall back to old format
  displaySingleModelResult({
    modelUsed: testResult.modelUsed,
    response: testResult.response,
    error: testResult.error
  });
}
```

### Pattern 2: Interface Versioning

**For Complex Changes**:
```typescript
// Version 1 Interface
interface LLMTestResultV1 {
  success: boolean;
  modelUsed: string;
  response: string;
}

// Version 2 Interface
interface LLMTestResultV2 {
  success: boolean;
  testResults: {
    primary: ModelTestResult;
    fallback: ModelTestResult;
  };
}

// Union Type for Transition
type LLMTestResult = LLMTestResultV1 | LLMTestResultV2;

// Type Guards
function isV2Result(result: LLMTestResult): result is LLMTestResultV2 {
  return 'testResults' in result;
}
```

**Frontend Usage**:
```typescript
const result = await testLLM({});

if (isV2Result(result)) {
  // Handle new format
  displayDualModelResults(result.testResults);
} else {
  // Handle legacy format
  displaySingleModelResult(result);
}
```

## Development Best Practices

### 1. Always Add Debug Logging During Development

```typescript
const testResult = await testLLM({});

// ✅ ALWAYS add this during interface changes
console.log("API Result Structure:", testResult);
console.log("Available properties:", Object.keys(testResult));

// Process the result...
```

**Why**: Immediately reveals if backend is returning expected structure.

### 2. Use TypeScript Strict Mode

```typescript
// ✅ Enable strict checking
"compilerOptions": {
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

**Why**: Catches interface mismatches at compile time.

### 3. Test with Real API Calls

```typescript
// ❌ DON'T test with mocked data only
const mockResult = { success: true, modelUsed: "test-model" };

// ✅ DO test with real Convex action calls
const realResult = await testLLM({});
console.log("Real API response:", realResult);
```

**Why**: Mocks can mask interface evolution issues.

### 4. Update All Consumers Simultaneously

**Frontend Components Using The Action**:
```bash
# Find all components using the action
grep -r "testLLMCommunication\|testLLM" apps/web/components/
grep -r "api.llmTest" apps/web/components/
```

**Update Each Component**:
- Check TypeScript interfaces
- Update data access patterns
- Test UI rendering with new data
- Verify error handling

## Common Anti-Patterns

### 1. "Backend First" Without Frontend Coordination

**Problem**:
```typescript
// Backend developer updates return type
return {
  success: true,
  newStructure: { /* enhanced data */ }
  // Removes: modelUsed, response
};

// Frontend still expects old structure
const model = result.modelUsed; // undefined!
const response = result.response; // undefined!
```

**Solution**: Coordinate interface changes or use additive approach.

### 2. Ignoring TypeScript Errors

**Problem**:
```typescript
// TypeScript shows errors after backend change
const model = result.modelUsed; // Property 'modelUsed' does not exist
const response = result.response; // Property 'response' does not exist

// Developer ignores errors or uses @ts-ignore
// @ts-ignore
const model = result.modelUsed;
```

**Solution**: Address interface mismatches properly, don't suppress errors.

### 3. Assuming Data Structure Without Verification

**Problem**:
```typescript
// Assumes new structure exists without checking
const primaryResult = result.testResults.primary; // Could crash if undefined
```

**Solution**: Always check for property existence or use optional chaining.
```typescript
const primaryResult = result.testResults?.primary;
if (!primaryResult) {
  console.warn("Expected testResults.primary not found in API response");
  return;
}
```

## Testing Checklist

When evolving API contracts:

- [ ] **TypeScript interfaces updated** in frontend
- [ ] **All consuming components identified** and updated
- [ ] **Debug logging added** to see actual API responses
- [ ] **Real API calls tested** (not just mocked data)
- [ ] **Error cases handled** (undefined properties, null values)
- [ ] **UI verified** to display new data correctly
- [ ] **Backward compatibility maintained** (if using additive approach)
- [ ] **Breaking changes documented** (if removing old properties)

## Code Review Guidelines

When reviewing interface changes:

- [ ] **Interface evolution strategy is clear** (additive vs breaking)
- [ ] **Frontend and backend changes are coordinated**  
- [ ] **TypeScript errors are addressed** (not suppressed with @ts-ignore)
- [ ] **Debug logging is present** during development
- [ ] **All consumers of the interface are updated**
- [ ] **Error handling covers interface edge cases**
- [ ] **Documentation explains the change rationale**

## Emergency Recovery

### When Interface Changes Break Production

1. **Identify the interface mismatch**:
   ```typescript
   console.log("API Response:", result);
   console.log("Expected properties:", ["success", "modelUsed", "response"]);
   console.log("Actual properties:", Object.keys(result));
   ```

2. **Quick fix with defensive coding**:
   ```typescript
   const modelUsed = result.modelUsed || result.testResults?.primary?.model || "unknown";
   const response = result.response || result.testResults?.primary?.response || "";
   ```

3. **Proper fix**:
   - Revert backend changes, OR
   - Update frontend interfaces and components properly
   - Deploy coordinated fix

## Related Documentation

- [Convex Action Patterns](../convex/action-patterns.md)
- [TypeScript Interface Design](../frontend/typescript-interfaces.md)  
- [Component Update Protocols](../frontend/component-update-protocols.md)
- [API Testing Strategies](../testing/api-testing-strategies.md)

---
**Last Updated**: 2025-08-20  
**Next Review**: 2025-09-20  
**Owner**: Full-Stack Development Team