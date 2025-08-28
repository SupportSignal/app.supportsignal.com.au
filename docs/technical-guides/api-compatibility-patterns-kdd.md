# API Compatibility Patterns - KDD

**Knowledge Discovery Date**: 2025-08-27  
**Context**: Resolving `clarificationAnswers:listByIncident` API mismatch error  
**Contributors**: Claude Code session  

## 📋 Problem Statement

Browser console error appeared in production:
```
Error: [CONVEX Q(clarificationAnswers:listByIncident)] Server Error
Could not find public function for 'clarificationAnswers:listByIncident'
```

Component expected API function that didn't exist, causing runtime failure.

## 🔍 Key Discoveries

### 1. Runtime vs Compile-time API Validation Gap

**Discovery**: TypeScript compilation passes even when Convex API functions are missing.

**Root Cause**: 
- TypeScript validates generated API types, not actual deployed functions
- Missing functions only discovered at runtime when called
- Generated `api.d.ts` may include functions that aren't deployed

**Implications**: API mismatches are deployment/runtime errors, not development errors.

### 2. API Function Naming Mismatches

**Discovery**: Function naming inconsistencies between components and backend.

**Pattern Found**:
```typescript
// Component expects:
api.clarificationAnswers.listByIncident

// But actual function exists as:
api.aiClarification.getClarificationAnswers
```

**Cause**: Refactoring or renaming without updating all references.

### 3. Backward Compatibility Solution Pattern

**Discovery**: Create compatibility modules to bridge API naming gaps.

**Implementation Pattern**:
```typescript
// Create apps/convex/clarificationAnswers.ts
import { v } from "convex/values";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";

export const listByIncident = query({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    // ... other args
  },
  handler: async (ctx, args) => {
    // @ts-ignore - Bypass TypeScript deep instantiation issue
    return await ctx.runQuery(internal.aiClarification.getClarificationAnswers, args);
  },
});
```

## 🛠️ Implementation Patterns

### 1. Compatibility Module Pattern

**When to Use**: Legacy components expect different API function names.

**Structure**:
```
apps/convex/
├── aiClarification.ts          # Actual implementation
├── clarificationAnswers.ts     # Compatibility wrapper
```

**Template**:
```typescript
// Compatibility wrapper
import { internal } from "./_generated/api";

export const legacyFunctionName = query({
  args: { /* same args as original */ },
  handler: async (ctx, args) => {
    // @ts-ignore - TypeScript workaround for internal calls
    return await ctx.runQuery(internal.actualModule.actualFunction, args);
  },
});
```

### 2. API Migration Pattern

**Step 1**: Create compatibility wrapper
**Step 2**: Deploy compatibility function  
**Step 3**: Test that error is resolved
**Step 4**: (Optional) Update components to use new API
**Step 5**: (Optional) Deprecate compatibility wrapper

### 3. API Discovery Pattern

**For Finding Missing Functions**:
```bash
# 1. Search codebase for API calls
rg "api\." apps/web/ --type tsx --type ts

# 2. Search for specific function calls
rg "clarificationAnswers.*listByIncident" --type tsx --type ts

# 3. Check generated API types
grep -r "listByIncident" apps/convex/_generated/
```

## 🚨 Common API Compatibility Issues

### 1. Function Exists But Wrong Module

**Symptom**: `Could not find public function for 'moduleA:functionName'`
**Cause**: Function exists in `moduleB` but component calls `moduleA`
**Solution**: Compatibility wrapper or component update

### 2. Function Name Changed

**Symptom**: `Could not find public function for 'module:oldName'`  
**Cause**: Function renamed from `oldName` to `newName`
**Solution**: Alias the old name to new function

### 3. Module Restructuring

**Symptom**: Multiple functions missing from expected module
**Cause**: Functions moved to different module during refactoring
**Solution**: Compatibility module with multiple aliases

### 4. TypeScript Deep Instantiation Issues

**Symptom**: `Type instantiation is excessively deep and possibly infinite`
**Cause**: Complex Convex internal API type inference  
**Solution**: Use `@ts-ignore` with clear comments

### 5. Internal API Parameter Naming Inconsistency ⚡ NEW

**Symptom**: `ArgumentValidationError: Object is missing the required field 'fieldName'`  
**Discovery Date**: 2025-08-28
**Cause**: Inconsistent parameter naming conventions across Convex internal functions:
- `incidents.getById` expects `{ id: ... }`
- `narratives.getByIncidentId` expects `{ incident_id: ... }`  
- `participants/getById.getParticipantById` expects `{ participantId: ... }`

**Example Error**:
```javascript
// PDF generation failed with:
ArgumentValidationError: Object is missing the required field `id`.
Object: {incident_id: "...", sessionToken: "..."}
Validator: v.object({id: v.id("incidents"), sessionToken: v.string()})
```

**Root Cause**: Different development periods and naming conventions created inconsistent internal APIs.

**Solution Pattern**:
```typescript
// ❌ Wrong - using incident_id parameter
const incident = await ctx.runQuery(internal.incidents.getById, {
  sessionToken: args.sessionToken,
  incident_id: args.incident_id  
});

// ✅ Correct - using id parameter  
const incident = await ctx.runQuery(internal.incidents.getById, {
  sessionToken: args.sessionToken,
  id: args.incident_id
});
```

### 6. Directory-Namespaced Internal API Functions ⚡ NEW

**Symptom**: `Could not find public function` for nested directory functions
**Discovery Date**: 2025-08-28
**Cause**: Convex internal API uses directory-based namespacing that differs from public API

**Example**:
```typescript
// ❌ Wrong - assuming flat namespace
internal.participants.getById

// ✅ Correct - directory-based namespace
internal["participants/getById"].getParticipantById
```

**Detection**: Check `_generated/api.d.ts` for directory imports:
```typescript
import type * as participants_getById from "../participants/getById.js";
```

### 7. Frontend-Backend Property Name Inconsistency ⚡ NEW

**Symptom**: UI displays incorrect validation status or undefined properties
**Discovery Date**: 2025-08-28  
**Cause**: Backend returns camelCase but frontend expects snake_case (or vice versa)

**Example**:
```typescript
// Backend returns:
{ allComplete: true, checklist: {...} }

// Frontend interface expects:
{ all_complete: boolean, checklist: {...} }

// Solution: Standardize in backend
return {
  checklist,
  all_complete: allComplete,  // Convert to expected format
  missing_requirements: ...
};
```

## 🔍 Debugging API Compatibility Issues

### 1. Identify the Error Source

```javascript
// Browser console will show:
Error: [CONVEX Q(moduleName:functionName)] Server Error
Could not find public function for 'moduleName:functionName'
```

### 2. Find Which Component Makes the Call

```bash
# Search for the specific API call
rg "moduleName.*functionName" apps/web/
rg "useQuery.*moduleName" apps/web/
```

### 3. Check if Function Exists Elsewhere

```bash
# Search Convex backend for similar function
rg "functionName" apps/convex/
rg "export.*function.*Name" apps/convex/
```

### 4. Verify Function Deployment

```bash
# Try calling function manually
bunx convex run moduleName:functionName '{"test": "args"}'
```

## 📋 Prevention Checklist

### Before Deployment:
- [ ] All API calls in components have corresponding Convex functions
- [ ] Function names match between frontend and backend  
- [ ] Test critical API calls manually with `bunx convex run`
- [ ] Verify generated `_generated/api.d.ts` matches deployed functions
- [ ] **NEW**: Validate internal API parameter naming consistency
- [ ] **NEW**: Check directory-namespaced function paths (`internal["dir/file"].functionName`)
- [ ] **NEW**: Verify frontend interface property names match backend response

### During Refactoring:
- [ ] Create compatibility wrappers for renamed functions
- [ ] Update component imports after testing compatibility
- [ ] Document API changes in KDD files
- [ ] Test in browser, not just TypeScript compilation
- [ ] **NEW**: Validate internal function calls with correct parameter names
- [ ] **NEW**: Test complete user workflows (e.g., PDF generation end-to-end)

### Code Review:
- [ ] Check for `api.module.function` calls in changed components
- [ ] Verify corresponding Convex functions exist
- [ ] Ensure imports use correct module names
- [ ] **NEW**: Validate internal API calls use correct parameter naming
- [ ] **NEW**: Check directory-based internal function paths
- [ ] **NEW**: Verify property name consistency between backend returns and frontend interfaces

### Internal API Development:
- [ ] **NEW**: Document parameter naming conventions (`id` vs `incident_id` vs `participantId`)
- [ ] **NEW**: Use consistent naming patterns within related functions  
- [ ] **NEW**: Update interfaces when changing backend response property names
- [ ] **NEW**: Test internal API calls from actions, not just queries

## 🎯 Testing Patterns

### 1. Manual API Testing

```bash
# Test function exists and is callable
bunx convex run clarificationAnswers:listByIncident '{
  "sessionToken": "test-session",
  "incident_id": "test-id"
}'
```

### 2. Component Integration Testing

```typescript
// In component tests, mock the expected API calls
jest.mock('convex/react', () => ({
  useQuery: jest.fn().mockImplementation((queryName) => {
    if (queryName.includes('clarificationAnswers.listByIncident')) {
      return mockData;
    }
    return null;
  }),
}));
```

### 3. End-to-End Workflow Testing

- Navigate to component in browser
- Check browser console for API errors
- Verify data loads correctly
- Test error states and edge cases

## 🔄 Future Improvements

1. **API Contract Testing**: Automated tests to verify API contracts
2. **Generated Client Validation**: Validate generated API matches deployed functions  
3. **Migration Scripts**: Automated API migration and compatibility generation
4. **Runtime API Discovery**: Dynamic API function discovery and validation
5. **Deprecation Warnings**: Warn when using compatibility functions