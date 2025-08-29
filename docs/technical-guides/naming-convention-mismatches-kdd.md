# Naming Convention Mismatches - KDD

**Knowledge Discovery Date**: 2025-08-29  
**Context**: Systematic pattern of frontend-backend naming inconsistencies causing runtime failures  
**Contributors**: Claude Code debugging sessions  
**Priority**: HIGH - Causes frequent runtime errors despite successful compilation  

## 📋 Problem Statement

A pervasive pattern has emerged across the codebase where frontend and backend systems use **different naming conventions** for the same conceptual data, causing runtime failures that pass TypeScript compilation. This creates a systematic **implementation vs validation gap** where features appear to work technically but fail in actual user workflows.

## 🔍 Documented Naming Mismatches

### 1. PDF Section Names (Discovered: 2025-08-29)

**Frontend Sends**:
```typescript
{
  basic_information: true,
  participant_details: true, 
  incident_narratives: true,
  enhanced_narrative: true,
  clarification_qa: true,
  metadata: true
}
```

**Backend Expected**:
```typescript
const PDF_SECTIONS = {
  overview: 'Incident Overview & Metadata',        // ❌ vs basic_information
  participant: 'Participant Information',          // ❌ vs participant_details
  brief_narratives: 'Brief Narrative Summaries',  // ❌ vs incident_narratives
  detailed_narratives: 'Enhanced Narratives',     // ❌ vs enhanced_narrative
  questions_answers: 'Questions & Answers',       // ❌ vs clarification_qa
  processing_info: 'Processing Information'       // ❌ vs metadata
}
```

**Impact**: Empty PDF files generated - sections never matched, no content added.

### 2. Validation Status Properties (Discovered: 2025-08-28)

**Backend Returns**:
```typescript
return {
  checklist,
  allComplete: true,    // ❌ camelCase
  missing_requirements
};
```

**Frontend Interface Expects**:
```typescript
interface ValidationResult {
  checklist: {...},
  all_complete: boolean,    // ❌ snake_case
  missing_requirements: string[]
}
```

**Impact**: UI shows incorrect validation status, workflow appears incomplete.

### 3. Internal API Parameter Names (Discovered: 2025-08-28)

**Multiple Parameter Naming Inconsistencies**:
```typescript
// incidents.getById expects:
{ id: v.id("incidents") }

// narratives.getByIncidentId expects:  
{ incident_id: v.id("incidents") }

// participants/getById.getParticipantById expects:
{ participantId: v.id("participants") }
```

**Impact**: PDF generation failed with ArgumentValidationError for parameter mismatches.

### 4. Directory-Namespaced Function Paths (Discovered: 2025-08-28)

**Assumed Path**:
```typescript
internal.participants.getById  // ❌ Flat namespace assumption
```

**Actual Path**:
```typescript
internal["participants/getById"].getParticipantById  // ✅ Directory-based namespace
```

**Impact**: Function not found errors for nested directory functions.

### 5. Enhanced Narrative Status Tracking (Discovered: 2025-08-28)

**Status Field Inconsistency**:
```typescript
// Completion status tracking:
"narrative_enhanced": false    // ❌ Wrong status field

// But actual data exists as:
"before_event_extra": "...",   // ✅ Enhanced content present
"during_event_extra": "...",
"end_event_extra": "...",
"post_event_extra": "..."
```

**Impact**: AI Enhancement shows incomplete despite all enhanced content existing.

## 🔄 Patterns Identified

### 1. **Case Convention Inconsistency**
- **Frontend**: Prefers `snake_case` for object properties
- **Backend**: Inconsistently uses `camelCase` and `snake_case`
- **APIs**: Mix of conventions within the same system

### 2. **Conceptual Name Divergence** 
- **Same Data, Different Names**: `basic_information` vs `overview`
- **Functional Synonyms**: `participant_details` vs `participant`
- **Scope Mismatches**: `incident_narratives` vs `brief_narratives`

### 3. **Parameter vs Property Misalignment**
- **Function Parameters**: Often use `camelCase` (`participantId`)
- **Database Fields**: Often use `snake_case` (`incident_id`)
- **Object Properties**: Mixed conventions (`allComplete` vs `all_complete`)

### 4. **Directory Structure vs API Naming**
- **Physical Structure**: `participants/getById.ts`
- **Internal API Path**: `internal["participants/getById"].functionName`
- **Assumption**: Flat namespace like public APIs

### 5. **Status Tracking vs Data Reality**
- **Status Fields**: May not accurately reflect actual data state
- **Data Existence**: Enhanced content exists but status shows incomplete
- **Validation Logic**: Checks wrong fields or uses wrong naming

## 🚨 Common Failure Patterns

### 1. **Silent Section Skipping**
```typescript
// Frontend sends: 'basic_information'
// Backend checks: selectedSections.includes('overview')  
// Result: Section silently skipped, empty PDF
```

### 2. **Undefined Property Access**
```typescript
// Backend returns: { allComplete: true }
// Frontend accesses: validation.all_complete
// Result: undefined, UI shows incorrect state
```

### 3. **Runtime Parameter Errors**
```typescript
// Call: internal.incidents.getById({ incident_id: "..." })
// Expected: { id: "..." }
// Result: ArgumentValidationError at runtime
```

### 4. **Function Not Found Errors**
```typescript
// Call: internal.participants.getById
// Actual: internal["participants/getById"].getParticipantById
// Result: Function not found, PDF generation fails
```

### 5. **Status Validation Failures**
```typescript
// Check: !!enhancedNarrative (separate table)
// Reality: Enhanced data in *_extra fields
// Result: Shows incomplete when actually complete
```

## 📊 Impact Assessment

### **Compilation vs Runtime**
- ✅ **TypeScript Compilation**: Always passes
- ❌ **Runtime Execution**: Frequent failures
- ❌ **User Experience**: Features appear broken
- ❌ **Development Confidence**: False success indicators

### **Detection Difficulty**
- **Low Visibility**: Errors only appear in browser console or user testing
- **Async Failures**: Issues surface during user workflows, not development
- **Silent Failures**: Some mismatches cause silent data omission (empty PDFs)
- **Complex Debugging**: Requires cross-system investigation to identify

### **Development Velocity Impact**
- **Repeated Debugging**: Same types of issues require investigation each time
- **User Feedback Loops**: Issues discovered during user testing, not development
- **Context Switching**: Requires understanding both frontend and backend naming

## 🛠️ Systematic Solutions Needed

### 1. **Naming Convention Standardization**
```typescript
// Establish single source of truth for property names
interface StandardizedNaming {
  database_fields: 'snake_case',
  api_parameters: 'snake_case', 
  frontend_properties: 'snake_case',
  function_names: 'camelCase'
}
```

### 2. **Type-Safe API Contracts**
```typescript
// Generate shared interfaces between frontend/backend
export interface PDFSectionOptions {
  basic_information: boolean;
  participant_details: boolean;
  // ... ensure naming consistency
}
```

### 3. **Runtime Validation Layer**
```typescript
// Add parameter validation for internal API calls
const validateInternalCall = (functionName: string, params: object) => {
  // Check parameter names match function signature
  // Throw descriptive errors for mismatches
};
```

### 4. **Centralized Configuration**
```typescript
// Single source of truth for section names, API paths, etc.
export const API_CONSTANTS = {
  PDF_SECTIONS: {
    basic_information: 'basic_information',
    // ... centralized naming
  },
  INTERNAL_API_PATHS: {
    participants: 'participants/getById.getParticipantById'
    // ... centralized paths
  }
};
```

### 5. **Development Tooling**
- **Lint Rules**: Enforce naming conventions
- **Build Checks**: Validate API contract consistency
- **Runtime Debugging**: Better error messages for naming mismatches
- **Documentation**: Centralized naming convention guide

## 🔗 Related Issues

This naming convention problem contributes to:
- [Implementation vs Testing Gap KDD](./implementation-vs-testing-gap-kdd.md) - Technical success ≠ user success
- [API Compatibility Patterns KDD](./api-compatibility-patterns-kdd.md) - Runtime API validation failures  
- [UI Debugging and Runtime Validation KDD](./ui-debugging-and-runtime-validation-kdd.md) - Frontend debugging challenges

## 📅 Next Steps (Future Work)

1. **Audit Existing Codebase**: Systematic identification of all naming mismatches
2. **Establish Standards**: Define single naming convention for all layers
3. **Migration Strategy**: Plan for updating existing APIs without breaking changes
4. **Tooling Implementation**: Build validation and enforcement tools
5. **Testing Framework**: Add naming convention validation to CI/CD pipeline

## 🎯 Success Metrics

**Current State**: Multiple naming convention mismatches causing runtime failures  
**Target State**: Single, consistent naming convention across all system layers  
**Measurement**: Zero runtime errors due to naming mismatches  
**Validation**: All PDF sections render, all API calls succeed, all UI states display correctly  

---

**This document serves as a comprehensive catalog of naming convention issues discovered during development. It should be referenced when planning systematic fixes to eliminate this class of runtime errors.**