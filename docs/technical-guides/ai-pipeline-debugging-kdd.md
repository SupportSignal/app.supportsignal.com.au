# AI Pipeline Debugging - Data Flow KDD

**Knowledge-Driven Development Document**  
**Created**: 2025-08-24  
**Context**: Systematic debugging of AI enhancement pipeline data flow issues including date interpolation, quote formatting, and export data mismatches

## Executive Summary

This KDD captures crucial patterns for debugging AI processing pipelines, particularly around data flow validation, template variable interpolation, and export/storage alignment. Key insight: **Data pipeline debugging requires end-to-end visibility**, not just error message resolution.

## Core Problem Patterns

### 1. **Template Variable Interpolation Failures**

**Symptom**: AI receives placeholder text instead of actual data
```
Template: "On {{eventDateTime}}"
AI Receives: "On {{eventDateTime}}" (unprocessed)
Expected: "On 2025-08-24T11:21" (processed)
```

**Root Cause**: Data mapping mismatches between database fields and template variables

### 1a. **AI Instruction Following Failures** (Story 6.3)

**Symptom**: Template changes are saved and retrieved correctly, but AI ignores instructions
```
Template: "Prefix questions with XMEN"
AI Receives: Template with XMEN instruction (✅ verified in logs)
AI Response: Questions without XMEN prefix (❌ ignores instruction)
```

**Root Cause**: AI models treat casual instructions as suggestions, not requirements

**Debug Pattern**:
```typescript
// Add comprehensive logging to track instruction flow
console.log(`🔍 TEMPLATE RETRIEVED`, {
  has_instruction_text: template.includes("XMEN"),
  template_preview: template.substring(0, 200)
});

console.log(`📝 TEMPLATE PROCESSED`, {
  has_instruction_in_final: interpolatedPrompt.includes("XMEN"), 
  final_prompt_preview: interpolatedPrompt.substring(0, 300)
});
```

**Solution**: Use forceful, explicit instruction language:
- ❌ Weak: "Prefix questions with XMEN"  
- ✅ Strong: "CRITICAL: Every question MUST start with 'XMEN:' - this is mandatory"

### 2. **Database Schema Assumptions**

**Anti-Pattern**: Assuming database indexes exist without verification
```typescript
// ❌ WRONG: Assume index exists
const questions = await ctx.db
  .query("clarification_questions")  
  .withIndex("by_question_id", (q) => q.eq("question_id", questionId))
```

**Correct Pattern**: Verify schema or use existing indexes with lookup
```typescript  
// ✅ CORRECT: Use verified index with in-memory lookup
const allQuestions = await ctx.db
  .query("clarification_questions")
  .withIndex("by_incident_phase", (q) => 
    q.eq("incident_id", args.incident_id).eq("phase", args.phase)
  )
  .collect();

const questionsMap = new Map();
allQuestions.forEach(q => questionsMap.set(q.question_id, q.question_text));
```

### 3. **Export vs Storage Data Misalignment**

**Problem**: Export functions look for data in wrong tables
- **Expected**: `enhanced_narratives` table (export function searches here)
- **Reality**: `incident_narratives.*_extra` fields (where data is actually stored)

## Systematic Debugging Framework

### **Phase 1: Data Flow Tracing (MANDATORY)**

```typescript
// End-to-end data flow validation checklist:

1. **Input Validation**
   - Log raw database retrieval
   - Verify all expected fields exist
   - Check data types match expectations

2. **Template Processing**  
   - Log template variables before interpolation
   - Log processed template sent to AI
   - Verify no {{placeholder}} text remains

3. **AI Processing**
   - Log AI request payload
   - Log AI response
   - Verify response format matches expectations

4. **Output Storage**
   - Log where data is being saved
   - Verify storage location matches export expectations
   - Check for data persistence issues
```

### **Phase 2: Comprehensive Logging Strategy**

```typescript
// ✅ COMPREHENSIVE LOGGING PATTERN
export const enhanceNarrativePhase = action({
  handler: async (ctx, args) => {
    // 1. Input logging
    console.log('📝 Input received:', {
      incident_id: args.incident_id,
      phase: args.phase,
      raw_args: args
    });

    // 2. Database retrieval logging
    const incidentData = await ctx.db.get(args.incident_id);
    console.log('🏢 Database data:', {
      found: !!incidentData,
      eventDateTime: incidentData?.event_date_time,
      fieldType: typeof incidentData?.event_date_time,
      allFields: Object.keys(incidentData || {})
    });

    // 3. Template variable logging  
    const templateVariables = {
      eventDateTime: incidentData?.event_date_time || 'Unknown Date/Time',
      // ... other variables
    };
    console.log('📝 Template variables:', {
      eventDateTime_raw: incidentData?.event_date_time,
      eventDateTime_mapped: templateVariables.eventDateTime,
      usingFallback: templateVariables.eventDateTime === 'Unknown Date/Time'
    });

    // 4. Template processing logging
    const processedPrompt = await ctx.runQuery(api.promptManager.getProcessedPrompt, {
      prompt_name: "enhance_narrative", 
      variables: templateVariables
    });
    console.log('🎯 Template processed:', {
      hasPlaceholders: processedPrompt.processedTemplate?.includes('{{'),
      templatePreview: processedPrompt.processedTemplate?.substring(0, 200)
    });

    // 5. AI result logging
    console.log('🤖 AI enhancement result:', {
      success: result.success,
      contentLength: result.enhanced_content?.length,
      hasQuoteIssues: result.enhanced_content?.includes('\n"')
    });
  }
});
```

## Critical Verification Points

### **Template Variable Validation**

```typescript
// ✅ VERIFICATION PATTERN
const verifyTemplateVariables = (variables: Record<string, any>) => {
  Object.entries(variables).forEach(([key, value]) => {
    if (typeof value === 'string' && value.includes('{{')) {
      console.warn(`⚠️ Unprocessed placeholder in ${key}: ${value}`);
    }
    if (value === 'Unknown' || value === 'Unknown Date/Time') {
      console.warn(`⚠️ Using fallback value for ${key}: ${value}`);
    }
  });
};
```

### **Database Schema Validation**

```typescript
// ✅ SCHEMA-AWARE QUERYING
const safeQueryWithIndex = async (ctx, tableName, indexName, callback) => {
  try {
    return await ctx.db.query(tableName).withIndex(indexName, callback).collect();
  } catch (error) {
    if (error.message.includes('Index') && error.message.includes('not found')) {
      console.error(`❌ Index ${indexName} not found on ${tableName}`);
      // Implement fallback strategy
      return await ctx.db.query(tableName).collect();
    }
    throw error;
  }
};
```

## Problem Resolution Patterns

### **Issue: Template Save/Regeneration Debugging** (Story 6.3)

**Diagnosis Framework**:
1. ✅ Check template saves successfully (UI shows success message)
2. ✅ Verify function deployment status (`bunx convex run function:name` test)  
3. ✅ Check schema validation errors in deployment logs
4. ✅ Test template retrieval with debug logging
5. ✅ Verify AI receives instruction in final prompt
6. ❌ Confirm AI follows instruction in response

**Debug Logging Pattern**:
```typescript
// Template save tracking
console.log("📝 PROMPT TEMPLATE UPDATED", {
  prompt_name: args.prompt_name,
  has_instruction: args.new_template.includes("INSTRUCTION_TEXT"),
  template_preview: args.new_template.substring(0, 200) + "..."
});

// Template retrieval tracking  
console.log("🔍 TEMPLATE RETRIEVED", {
  has_instruction: prompt.prompt_template.includes("INSTRUCTION_TEXT"),
  template_preview: prompt.prompt_template.substring(0, 200) + "..."
});

// Final prompt verification
console.log("📝 TEMPLATE PROCESSED", {
  has_instruction_in_final: interpolatedPrompt.includes("INSTRUCTION_TEXT"),
  final_prompt_preview: interpolatedPrompt.substring(0, 300) + "..."
});
```

**Resolution Workflow**:
1. **Schema Issues** → Add removed fields as optional for backward compatibility
2. **AI Instruction Following** → Use explicit, forceful language instead of casual instructions

### **Issue: "Unspecified Date" Despite Available Data**

**Diagnosis Framework**:
1. Check database field exists: `event_date_time`
2. Verify template variable mapping: `eventDateTime: incidentData?.event_date_time`  
3. Confirm template placeholder: `{{eventDateTime}}`
4. Validate processing: No `{{eventDateTime}}` in final template

**Resolution**: Database field mapping mismatch - verify exact field names

### **Issue: Quote Formatting Problems**

**Solution Pattern**:
```typescript
// Update prompt template with specific guidance
const promptGuidance = `
**Quote Formatting**: Keep direct quotes on the same line as surrounding text - never break quotes across lines or place quote marks alone on separate lines
`;
```

**Verification**: Check AI output contains no orphaned quote marks or line-broken quotes

### **Issue: Export Data Not Found**

**Problem**: Export function searches `enhanced_narratives` table, data stored in `incident_narratives.*_extra` fields

**Solution**: Align export expectations with actual storage locations
```typescript
// Export should look in narrative_data.*_extra fields
narrative_data: {
  before_event_extra: narrative.before_event_extra, // ← Actual location
  during_event_extra: narrative.during_event_extra, // ← Actual location
  // ... not in enhanced_narratives table
}
```

## Quality Validation Framework

### **AI Enhancement Quality Gates**

```typescript
const validateEnhancementQuality = (original: string, enhanced: string) => {
  const checks = {
    preservesContent: enhanced.includes(original.substring(0, 50)),
    noPlaceholders: !enhanced.includes('{{'),
    noMockArtifacts: !enhanced.includes('[MOCK'),
    properQuoting: !enhanced.match(/"\s*\n/),
    reasonable_length: enhanced.length > original.length * 1.2,
    professional_tone: !enhanced.toLowerCase().includes('lorem ipsum')
  };
  
  const failed = Object.entries(checks).filter(([_, passed]) => !passed);
  if (failed.length > 0) {
    console.warn('⚠️ Quality issues:', failed.map(([check]) => check));
  }
  
  return failed.length === 0;
};
```

## Testing Strategy

### **Data Pipeline Testing**

```typescript  
// ✅ END-TO-END PIPELINE TESTS
describe('AI Enhancement Pipeline', () => {
  test('preserves all original data', () => {
    const result = enhanceNarrativePhase(mockInput);
    expect(result.enhanced_content).toContain(mockInput.originalNarrative);
  });

  test('processes template variables correctly', () => {
    const result = enhanceNarrativePhase({
      ...mockInput,
      incident: { event_date_time: '2025-08-24T11:21' }
    });
    expect(result.enhanced_content).not.toContain('{{eventDateTime}}');
    expect(result.enhanced_content).toContain('2025-08-24T11:21');
  });

  test('handles quotes properly', () => {
    const result = enhanceNarrativePhase(mockInput);
    expect(result.enhanced_content).not.toMatch(/"\s*\n/); // No broken quotes
  });
});
```

## Prevention Strategies

### **Development Checklist**

- [ ] **End-to-end data flow tracing** from database to AI output
- [ ] **Template variable validation** before AI processing  
- [ ] **Schema verification** before assuming indexes exist
- [ ] **Export alignment check** - data storage vs export expectations
- [ ] **Quality gate validation** on AI outputs
- [ ] **Comprehensive logging** at each pipeline stage

### **Code Review Focus Areas**

1. **Data Flow Continuity**: Can you trace data from source to destination?
2. **Template Processing**: Are all variables properly interpolated?
3. **Error Handling**: What happens when data is missing or malformed?
4. **Quality Validation**: Does output meet business standards?
5. **Storage Consistency**: Do exports find data where it's actually stored?

## Integration Points

### **Related KDDs**
- [Business Logic Validation Failure KDD](business-logic-validation-failure-kdd.md)
- [Testing Infrastructure Lessons Learned](../testing/technical/testing-infrastructure-lessons-learned.md)

### **Development Tools**
```bash
# Pipeline debugging commands
bunx convex run ai_prompts.listAllPrompts --args '{"sessionToken":"..."}' 
grep -r "TODO\|FIXME\|MOCK" apps/convex/
grep -r "event_date_time\|eventDateTime" apps/convex/
```

## Conclusion

**The Golden Rule**: **Trace data flow end-to-end before debugging individual components.**

AI pipeline issues are rarely isolated problems. They're usually symptoms of:
- Data mapping mismatches between components
- Schema assumptions without verification  
- Storage/export location misalignment
- Inadequate logging visibility

**Prevention**: Implement comprehensive logging and validation at each pipeline stage, not just error handling.

---

**Impact**: This systematic approach reduced debugging time from hours to minutes for template variable and data flow issues.